-- =============================================================================
-- Eventiko — Seed data (demo content for local / staging)
-- Run AFTER you have created an admin auth user, then update settings.
-- =============================================================================

-- Default platform settings: 8% fee, EUR, hero + footer content
update settings set
  platform_fee_rate = 8,
  currency = 'EUR',
  payout_min = 50,
  support_email = 'support@eventiko.com',
  hero = jsonb_build_object(
    'title', 'Live moments, made unforgettable.',
    'subtitle', 'Discover and book tickets to the best concerts, festivals and events across Europe and beyond.',
    'ctaText', 'Explore events',
    'ctaLink', '/events',
    'backgroundImage', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=2000&q=80'
  ),
  footer = jsonb_build_object(
    'about', 'Eventiko is a global ticketing platform connecting fans with unforgettable live experiences. Sell, buy and scan tickets with confidence.',
    'contactEmail', 'support@eventiko.com',
    'contactPhone', '+33 1 23 45 67 89',
    'social', jsonb_build_object('twitter', 'https://twitter.com', 'instagram', 'https://instagram.com', 'facebook', 'https://facebook.com'),
    'columns', jsonb_build_array(
      jsonb_build_object('title', 'Discover', 'links', jsonb_build_array(
        jsonb_build_object('label', 'All events', 'href', '/events'),
        jsonb_build_object('label', 'News', 'href', '/news'),
        jsonb_build_object('label', 'Sell tickets', 'href', '/sell')
      )),
      jsonb_build_object('title', 'Company', 'links', jsonb_build_array(
        jsonb_build_object('label', 'About', 'href', '/about'),
        jsonb_build_object('label', 'Contact', 'href', '/contact'),
        jsonb_build_object('label', 'Terms', 'href', '/terms'),
        jsonb_build_object('label', 'Privacy', 'href', '/privacy')
      ))
    )
  ),
  branding = jsonb_build_object('primary', '#7C3AED', 'accent', '#EC4899')
where id = 1;

-- Sample promotion for the hero
insert into broadcasts (title, message, type, cta_text, link_url, bg_color, text_color, is_active, priority)
values
  ('Summer Festival Season is here 🎉', 'Up to 20% off selected festival passes across Europe this week.', 'promotion', 'Browse festivals', '/events?category=Festival', '#7C3AED', '#FFFFFF', true, 10)
on conflict do nothing;
