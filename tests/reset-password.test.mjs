import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../src/utils/verifyResetPassword.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { verifyResetPassword } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
const user = {id:"account-1",email:"owner@example.com"};
test("reset verification requires a signed-in account and a password", async () => {
 const auth = {signInWithPassword:async () => {throw new Error("Should not call authentication");}};
 await assert.rejects(verifyResetPassword(auth,null,"password"),/Sign in again/);
 await assert.rejects(verifyResetPassword(auth,user,""),/Enter your account/);
});
test("wrong password or a different account cannot authorize reset", async () => {
 await assert.rejects(verifyResetPassword({signInWithPassword:async()=>({data:{user:null},error:{message:"Wrong password"}})},user,"incorrect"),/verification failed/);
 await assert.rejects(verifyResetPassword({signInWithPassword:async()=>({data:{user:{id:"other-account"}},error:null})},user,"incorrect"),/verification failed/);
});
test("valid password is verified against the current account", async () => {
 let credentials;
 await verifyResetPassword({signInWithPassword:async(input)=>{credentials=input;return {data:{user:{id:user.id}},error:null};}},user,"correct-password");
 assert.deepEqual(credentials,{email:user.email,password:"correct-password"});
});
test("network errors do not authorize reset", async () => {
 await assert.rejects(verifyResetPassword({signInWithPassword:async()=>{throw new Error("Network unavailable");}},user,"password"),/Network unavailable/);
});
