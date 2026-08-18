-- FUJRS — "payment received" becomes a status of its own.
--
-- Cash on Delivery is the only method that completes an order, so the money
-- arrives by hand and someone has to record that it did. Until now DELIVERED
-- stood for both "the customer has the piece" and "we have the cash", which is
-- two facts on one flag: an order handed over with the payment still to
-- collect looked identical to one paid in full.
--
-- So the enum gains a step between PROCESSING and DELIVERED. It is added
-- AFTER 'PROCESSING' rather than appended, because the enum's declared order
-- is its sort order, and a status list that reads confirmed, processing,
-- delivered, payment received would misdescribe the flow anywhere it is
-- ordered by status.
--
-- The transition rules that let an order reach it are a separate migration:
-- Postgres will not let a value added here be USED in the same transaction.

alter type order_status add value if not exists 'PAYMENT_RECEIVED' after 'PROCESSING';
