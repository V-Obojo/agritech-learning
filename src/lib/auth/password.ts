import "server-only";
import { compare, hash } from "bcryptjs";
import { passwordSchema } from "./validation";
export async function hashPassword(password:string) { return hash(passwordSchema.parse(password),10); }
export async function verifyPassword(password:string,encoded:string) { return compare(password,encoded); }
