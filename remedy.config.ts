import { syncExtensions } from "./lib/extensions";

export default {
    port: 4321,
    public: "public",
    features: ["compress", "tailwind", "refresh", "template", "static"],
    jobs: [
        {
            name: "Syncing extensions",
            schedule: { hours: 3, runImmediately: true },
            task: syncExtensions,
        },
    ],
};
