import { Router } from "express";
import { stripe } from "../lib/stripe";
import { supabaseAdmin } from "../lib/supabase";
import { asyncHandler, AppError } from "../lib/http";
import { getUserFromRequest } from "../lib/auth";
import { countryToIso } from "../lib/countries";
import { config } from "../config";

export const connectRouter = Router();

async function loadSeller(sellerId: string) {
  const { data } = await supabaseAdmin
    .from("sellers")
    .select("id, contact_email, country, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarded")
    .eq("id", sellerId)
    .single();
  return data;
}

/** Sync the connected account's capability flags back to the seller row. */
async function syncAccount(sellerId: string, accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  await supabaseAdmin
    .from("sellers")
    .update({
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_onboarded: account.details_submitted,
    })
    .eq("id", sellerId);
  return account;
}

/** Start (or resume) Stripe Connect onboarding — returns a hosted link. */
connectRouter.post(
  "/onboard",
  asyncHandler(async (req, res) => {
    const user = await getUserFromRequest(req);
    if (!user.sellerId) throw new AppError(403, "Only sellers can connect Stripe.");

    const seller = await loadSeller(user.sellerId);
    if (!seller) throw new AppError(404, "Seller not found.");

    let accountId = seller.stripe_account_id as string | null;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: seller.contact_email || user.email,
        country: countryToIso(seller.country),
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: { name: undefined },
        metadata: { sellerId: seller.id },
      });
      accountId = account.id;
      await supabaseAdmin.from("sellers").update({ stripe_account_id: accountId }).eq("id", seller.id);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${config.frontendUrl}/dashboard/payouts?connect=refresh`,
      return_url: `${config.frontendUrl}/dashboard/payouts?connect=return`,
      type: "account_onboarding",
    });

    res.json({ url: link.url });
  })
);

/** Current Connect status for the seller (refreshes flags from Stripe). */
connectRouter.get(
  "/status",
  asyncHandler(async (req, res) => {
    const user = await getUserFromRequest(req);
    if (!user.sellerId) throw new AppError(403, "Only sellers can use Connect.");

    const seller = await loadSeller(user.sellerId);
    if (!seller) throw new AppError(404, "Seller not found.");

    if (!seller.stripe_account_id) {
      return res.json({ connected: false, chargesEnabled: false, payoutsEnabled: false, onboarded: false });
    }

    const account = await syncAccount(seller.id, seller.stripe_account_id);
    res.json({
      connected: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      onboarded: account.details_submitted,
      dashboardPending: !account.details_submitted,
    });
  })
);
