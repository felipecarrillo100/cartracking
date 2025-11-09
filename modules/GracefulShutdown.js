// ✅ Add graceful shutdown support
function setupGracefulShutdown(trackEmitter, broker) {
    const shutdown = async (signal) => {
        console.log(`\nReceived ${signal}, shutting down gracefully...`);

        try {
            trackEmitter.stopTrackGenerator(); // ✅ Stop timers
            if (broker && typeof broker.disconnect === "function") {
                await broker.disconnect(); // ✅ Clean broker close if supported
            }
        } catch (err) {
            console.error("Error during shutdown:", err);
        } finally {
            console.log("Shutdown complete. Exiting.");
            process.exit(0);
        }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));  // Ctrl + C locally
    process.on("SIGTERM", () => shutdown("SIGTERM")); // Docker stop
}

module.exports = {
    setupGracefulShutdown
};
