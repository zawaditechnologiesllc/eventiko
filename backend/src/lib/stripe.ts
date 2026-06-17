import Stripe from "stripe";
import { config } from "../config";

export const stripe = new Stripe(config.stripeSecretKey, {
  // Use the account's default API version; typed loosely to avoid version drift.
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
  appInfo: { name: "Eventiko", version: "1.0.0" },
});
