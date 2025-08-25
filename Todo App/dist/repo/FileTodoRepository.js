"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTodoRepository = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const Result_1 = require("../utils/Result");
class FileTodoRepository {
    constructor(customPath) {
        this.dataPath =
            customPath ?? path.resolve(__dirname, "../../data/todos.json");
    }
    async loadAll() {
        try {
            await this.ensureFile(this.dataPath, "[]");
            const raw = await fs_1.promises.readFile(this.dataPath, "utf-8");
            const parsed = JSON.parse(raw ?? "[]");
            if (!Array.isArray(parsed)) {
                return (0, Result_1.Err)("Corrupted data file: not an array.");
            }
            const safe = [];
            for (const it of parsed) {
                if (it &&
                    typeof it.id === "string" &&
                    typeof it.title === "string" &&
                    (it.status === "open" || it.status === "done")) {
                    safe.push(it);
                }
            }
            return (0, Result_1.Ok)(safe);
        }
        catch {
            return (0, Result_1.Err)("Could not read todos.json");
        }
    }
    async saveAll(todos) {
        try {
            await this.ensureDirOf(this.dataPath);
            const tmp = this.dataPath + ".tmp";
            await fs_1.promises.writeFile(tmp, JSON.stringify(todos, null, 2) + "\n", "utf-8");
            await fs_1.promises.rename(tmp, this.dataPath);
            return (0, Result_1.Ok)(undefined);
        }
        catch {
            return (0, Result_1.Err)("Could not write todos.json");
        }
    }
    async ensureFile(filePath, initContent) {
        await this.ensureDirOf(filePath);
        try {
            await fs_1.promises.access(filePath);
        }
        catch {
            await fs_1.promises.writeFile(filePath, initContent, "utf-8");
        }
    }
    async ensureDirOf(filePath) {
        const dir = path.dirname(filePath);
        await fs_1.promises.mkdir(dir, { recursive: true });
    }
}
exports.FileTodoRepository = FileTodoRepository;
