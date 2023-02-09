
#include "nsXULAppAPI.h"
#include "mozilla/XREAppData.h"
#include "XREShellData.h"
#include "application.ini.h"
#include "mozilla/Bootstrap.h"
#include "mozilla/ProcessType.h"
#include "mozilla/RuntimeExceptionModule.h"
#include "mozilla/ScopeExit.h"
#if defined(XP_WIN)
#include <windows.h>
#include <stdlib.h>
#elif defined(XP_UNIX)
#include <sys/resource.h>
#include <unistd.h>
#endif

#include <stdio.h>
#include <stdarg.h>
#include <time.h>

#include "nsCOMPtr.h"

#ifdef XP_WIN
#include "mozilla/PreXULSkeletonUI.h"
#include "freestanding/SharedSection.h"
#include "LauncherProcessWin.h"
#include "mozilla/GeckoArgs.h"
#include "mozilla/mscom/ProcessRuntime.h"
#include "mozilla/WindowsDllBlocklist.h"
#include "mozilla/WindowsDpiInitialization.h"
#include "mozilla/WindowsProcessMitigations.h"

#define XRE_WANT_ENVIRON
#define strcasecmp _stricmp
#ifdef MOZ_SANDBOX
#include "mozilla/sandboxing/SandboxInitialization.h"
#endif
#endif
#include "BinaryPath.h"

#include "nsXPCOMPrivate.h" // for MAXPATHLEN and XPCOM_DLL

#include "mozilla/Sprintf.h"
#include "mozilla/StartupTimeline.h"
#include "BaseProfiler.h"

#include <cstddef>
#include "mozilla/CmdLineAndEnvUtils.h"

#ifdef LIBFUZZER
#include "FuzzerDefs.h"
#endif

using namespace mozilla;

const char *kDesktopFolder = "browser";

// From what I can tell, this stores the result of bootstrapping to avoid
// initing it multiple times
Bootstrap::UniquePtr gBootstrap;

static nsresult InitXPCOMGlue(LibLoadingStrategy aLibLoadingStrategy)
{
    // If we have already bootstraped, we do not want to do it again
    if (gBootstrap)
    {
        return NS_OK;
    }

    UniqueFreePtr<char> exePath = BinaryPath::Get();
    if (!exePath)
    {
        printf("Couldn't fild the application directory.\n");
        return NS_ERROR_FAILURE;
    }

    // Load the XPCOM dynamic library
    auto bootstrapResult = mozilla::GetBootstrap(exePath.get(), aLibLoadingStrategy);
    if (bootstrapResult.isErr())
    {
        printf("Couldn't load XPCOM.\n");
        return NS_ERROR_FAILURE;
    }

    gBootstrap = bootstrapResult.unwrap();

    // Start the main thread
    gBootstrap->NS_LogInit();

    return NS_OK;
}

// This is a renamed version of the firefox do_main function
static int runXPCShell(int argc, char *argv[], char *envp[])
{
    BootstrapConfig config;

    config.appData = &sAppData;
    config.appDataPath = kDesktopFolder;

    // TODO: Do we need to add support for MOZ_SANDBOX on Windows
    // NOTE: We do not have access to lib fuzer

    // NOTE: FF needs to keep in sync with LauncherProcessWin,
    //       TB doesn't have that file.
    //       Nor does this template
    const char *acceptableParams[] = {};
    EnsureCommandlineSafe(argc, argv, acceptableParams);

    return gBootstrap->XRE_main(argc, argv, config);
}

#ifdef HAS_DLL_BLOCKLIST
// NB: This must be extern, as this value is checked elsewhere
uint32_t gBlocklistInitFlags = eDllBlocklistInitFlagDefault;
#endif

int main(int argc, char *argv[], char *envp[])
{
#if defined(MOZ_ENABLE_FORKSERVER)
    if (strcmp(argv[argc - 1], "forkserver") == 0)
    {
        nsresult rv = InitXPCOMGlue(LibLoadingStrategy::NoReadAhead);
        if (NS_FAILED(rv))
        {
            return 255;
        }

        // Run a fork server in this process, single thread.  When it
        // returns, it means the fork server have been stopped or a new
        // content process is created.
        //
        // For the later case, XRE_ForkServer() will return false, running
        // in a content process just forked from the fork server process.
        // argc & argv will be updated with the values passing from the
        // chrome process.  With the new values, this function
        // continues the reset of the code acting as a content process.
        if (gBootstrap->XRE_ForkServer(&argc, &argv))
        {
            // Return from the fork server in the fork server process.
            // Stop the fork server.
            gBootstrap->NS_LogTerm();
            return 0;
        }
        // In a content process forked from the fork server.
        // Start acting as a content process.
    }
#endif

    // Make sure we unregister the runtime exception module before returning.
    // We do this here to cover both registers for child and main processes.
    auto unregisterRuntimeExceptionModule =
        MakeScopeExit([]
                      { CrashReporter::UnregisterRuntimeExceptionModule(); });

#ifdef MOZ_BROWSER_CAN_BE_CONTENTPROC
    // We are launching as a content process, delegate to the appropriate
    // main
    if (argc > 1 && IsArg(argv[1], "contentproc"))
    {
        // Set the process type. We don't remove the arg here as that will be done
        // later in common code.
        SetGeckoProcessType(argv[argc - 1]);

        // Register an external module to report on otherwise uncatchable
        // exceptions. Note that in child processes this must be called after Gecko
        // process type has been set.
        CrashReporter::RegisterRuntimeExceptionModule();

#ifdef HAS_DLL_BLOCKLIST
        uint32_t initFlags =
            gBlocklistInitFlags | eDllBlocklistInitFlagIsChildProcess;
        SetDllBlocklistProcessTypeFlags(initFlags, GetGeckoProcessType());
        DllBlocklist_Initialize(initFlags);
#endif // HAS_DLL_BLOCKLIST
#if defined(XP_WIN) && defined(MOZ_SANDBOX)
        // We need to set whether our process is supposed to have win32k locked down
        // from the command line setting before GetInitializedTargetServices and
        // WindowsDpiInitialization.
        Maybe<bool> win32kLockedDown =
            mozilla::geckoargs::sWin32kLockedDown.Get(argc, argv);
        if (win32kLockedDown.isSome() && *win32kLockedDown)
        {
            mozilla::SetWin32kLockedDownInPolicy();
        }

        // We need to initialize the sandbox TargetServices before InitXPCOMGlue
        // because we might need the sandbox broker to give access to some files.
        if (IsSandboxedProcess() && !sandboxing::GetInitializedTargetServices())
        {
            Output("Failed to initialize the sandbox target services.");
            return 255;
        }
#endif
#if defined(XP_WIN)
        // Ideally, we would be able to set our DPI awareness in
        // firefox.exe.manifest Unfortunately, that would cause Win32k calls when
        // user32.dll gets loaded, which would be incompatible with Win32k Lockdown
        //
        // MSDN says that it's allowed-but-not-recommended to initialize DPI
        // programatically, as long as it's done before any HWNDs are created.
        // Thus, we do it almost as soon as we possibly can
        {
            auto result = mozilla::WindowsDpiInitialization();
            (void)result; // Ignore errors since some tools block DPI calls
        }
#endif

        nsresult rv = InitXPCOMGlue(LibLoadingStrategy::NoReadAhead);
        if (NS_FAILED(rv))
        {
            return 255;
        }

        int result = content_process_main(gBootstrap.get(), argc, argv);

#if defined(DEBUG) && defined(HAS_DLL_BLOCKLIST)
        DllBlocklist_Shutdown();
#endif

        // InitXPCOMGlue calls NS_LogInit, so we need to balance it here.
        gBootstrap->NS_LogTerm();

        return result;
    }
#endif

    nsresult rv = InitXPCOMGlue(LibLoadingStrategy::NoReadAhead);
    if (NS_FAILED(rv))
    {
        printf("InitXPCOMGlue failed\n");
        return 255;
    }

#ifdef MOZ_BROWSER_CAN_BE_CONTENTPROC
    gBootstrap->XRE_EnableSameExecutableForContentProc();
#endif

    int result = runXPCShell(argc, argv, envp);

#if defined(XP_WIN)
    CleanupProcessRuntime();
#endif

    gBootstrap->NS_LogTerm();

#if defined(DEBUG) && defined(HAS_DLL_BLOCKLIST)
    DllBlocklist_Shutdown();
#endif

#ifdef XP_MACOSX
    // Allow writes again. While we would like to catch writes from static
    // destructors to allow early exits to use _exit, we know that there is
    // at least one such write that we don't control (see bug 826029). For
    // now we enable writes again and early exits will have to use exit instead
    // of _exit.
    gBootstrap->XRE_StopLateWriteChecks();
#endif

    gBootstrap.reset();
    return result;
}
