import { z } from "zod";

export const nigerianStates=["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Federal Capital Territory","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"] as const;
export const passwordSchema=z.string().min(8,"Use at least 8 characters.").max(72,"Use at most 72 characters.")
  .regex(/[a-zA-Z]/,"Include at least one letter.").regex(/[0-9]/,"Include at least one number.")
  .refine(value=>new TextEncoder().encode(value).length<=72,"Use at most 72 bytes.");
const email=z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
const name=z.string().trim().min(1,"Enter your name.").max(60,"Use at most 60 characters.");
const state=z.enum(nigerianStates).nullable().optional();
const intention=z.string().trim().min(1).max(100).nullable().optional();
export const signupSchema=z.object({name,email,password:passwordSchema,state,intention}).strict();
export const signinSchema=z.object({email,password:z.string().min(1,"Enter your password.").max(72)}).strict();
export const profileSchema=z.object({name,state,intention,theme:z.enum(["light","dark"]).nullable()}).strict();
export const changePasswordSchema=z.object({currentPassword:z.string().min(1).max(72),newPassword:passwordSchema}).strict();
export const deleteAccountSchema=z.object({confirmation:z.literal("DELETE")}).strict();
export function safeCallback(value:unknown) {
  return typeof value==="string" && /^\/(?![\\/])/.test(value) && !/[\\\u0000-\u0020]/.test(value) ? value : "/dashboard";
}
