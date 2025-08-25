"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ok = Ok;
exports.Err = Err;
function Ok(value) {
    return { ok: true, value };
}
function Err(error) {
    return { ok: false, error };
}
