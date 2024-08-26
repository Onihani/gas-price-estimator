// imports
import { z } from "zod";

export const formSchema = z.object({
  // ethereum address
  senderAddress: z
    .string({
      required_error: "Please enter a valid Ethereum address",
    })
    .trim()
    .min(1, {
      message: "Please enter a valid Ethereum address",
    }),
  // contract address
  contractAddress: z
    .string({
      required_error: "Please enter a valid Contract address",
    })
    .trim()
    .min(1, {
      message: "Please enter a valid Contract address",
    }),
  // contract method
  contractMethod: z
    .string({
      required_error: "Please select a valid Contract method (write method)",
    })
    .trim()
    .min(1, {
      message: "Please select a valid Contract method (write method)",
    }),
  // contract args
  contractArgs: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        value: z.union([z.number(), z.string(), z.boolean()]),
      })
    )
    .default([]),
});

export type FormValues = z.infer<typeof formSchema>;
