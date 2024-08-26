// imports
import { z } from "zod";

export const formSchema = z
  .object({
    // ethereum address
    fromAddress: z
      .string({
        required_error: "Please enter a valid Ethereum address",
      })
      .trim()
      .min(1, {
        message: "Please enter a valid Ethereum address",
      }),
    // ethereum address
    toAddress: z
      .string({
        required_error: "Please enter a valid Ethereum address",
      })
      .trim()
      .min(1, {
        message: "Please enter a valid Ethereum address",
      }),
    // amount in ether
    amount: z.object({
      // check if value is a valid number greater than 0
      value: z
        .string({
          required_error: "Please enter a valid amount",
        })
        .trim()
        .min(1, {
          message: "Please enter a valid amount",
        })
        .refine(
          (value) => {
            const parsedValue = parseFloat(value);
            return !isNaN(parsedValue) && parsedValue > 0;
          },
          {
            message: "Please enter a valid amount",
          }
        ),
      isUsd: z.boolean().default(false),
    }),
  })
  .refine(
    (data) => {
      // make sure to address is not the same as fromAddress
      return data.fromAddress !== data.toAddress;
    },
    {
      message: "From and to addresses cannot be the same",
      path: ["toAddress"],
    }
  );

export type FormValues = z.infer<typeof formSchema>;
