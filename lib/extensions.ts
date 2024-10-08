import { $ } from "bun";
import { parse as parseToml } from "@iarna/toml";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { parse as parseJsonc } from "comment-json";

export async function syncExtensions(): Promise<void> {
    console.log("Syncing extensions...");
    if (existsSync("extensions/extensions.toml")) {
        await $`git -C extensions pull --recurse-submodules=on-demand`;
        await $`git -C extensions submodule update --init --recursive`;
    } else {
        await $`git clone --recurse-submodules https://github.com/zed-industries/extensions.git extensions`;
    }
    console.log("Done");
}

export function lastExtensionUpdate() {
    const stat = statSync("extensions/extensions.toml");
    return stat.mtime;
}

interface ExtensionInfo {
    submodule: string;
    path?: string;
}

interface ExtensionDetail {
    name: string;
    version: string;
}

export interface SyntaxStyles {
    color?: string;
    font_weight?: number;
    font_style?: string;
}

interface Theme {
    name: string;
    appearance: string;
    extensionName: string;
    extensionVersion: string;
    author: string;
    style: Record<string, unknown> & {
        syntax: Record<string, SyntaxStyles>;
    };
}

export function getThemes() {
    const extensions = parseToml(readFileSync("extensions/extensions.toml", "utf-8")) as unknown as Record<
        string,
        ExtensionInfo
    >;

    return Object.values(extensions)
        .flatMap((info) => {
            const extensionPath = `extensions/${info.submodule}${info.path ? `/${info.path}` : ""}`;
            const themesPath = `${extensionPath}/themes`;
            if (existsSync(themesPath)) {
                const extension = (existsSync(`${extensionPath}/extension.toml`)
                    ? parseToml(readFileSync(`${extensionPath}/extension.toml`, "utf-8"))
                    : parseJsonc(
                          readFileSync(`${extensionPath}/extension.json`, "utf-8"),
                      )) as unknown as ExtensionDetail;
                const paths = readdirSync(themesPath)
                    .filter((it) => it.endsWith(".json"))
                    .map((it) => `${themesPath}/${it}`);
                return paths.flatMap((path) => {
                    const themeFile = parseJsonc(readFileSync(path, "utf-8")) as unknown as {
                        author: string;
                        themes: { name: string; appearance: string }[];
                    };
                    if (!themeFile.themes) {
                        return null;
                    }
                    return themeFile.themes.flatMap((theme) => {
                        return {
                            extensionName: extension.name,
                            extensionVersion: extension.version,
                            author: themeFile.author,
                            ...theme,
                        };
                    });
                });
            }
            return null;
        })
        .filter((it) => it) as Theme[];
}
