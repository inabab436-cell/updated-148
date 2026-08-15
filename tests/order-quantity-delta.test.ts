import { describe, expect, it } from "vitest";
import { subtractAlreadyDeducted } from "@/lib/order-quantity-delta";

const line = (quantity: number) => ({
  product_name: "كوب سيراميك",
  color: "أزرق",
  size: "M",
  quantity,
});

const deductedOrder = (quantity: number) => ({
  status: "new",
  items: [line(quantity)],
  stock_deducted: [{ variant_id: "v1", quantity }],
});

describe("subtractAlreadyDeducted", () => {
  it("deducts only the difference when the line grows", () => {
    const res = subtractAlreadyDeducted([line(2)], [deductedOrder(1)]);
    expect(res.items).toHaveLength(1);
    expect(res.items[0]!.quantity).toBe(1);
    expect(res.allAlreadyDeducted).toBe(false);
    expect(res.adjustments[0]).toMatchObject({
      requested_total: 2,
      already_deducted: 1,
      to_deduct: 1,
    });
  });

  it("reports nothing new when the total was already deducted", () => {
    const res = subtractAlreadyDeducted([line(1)], [deductedOrder(1)]);
    expect(res.items).toHaveLength(0);
    expect(res.allAlreadyDeducted).toBe(true);
  });

  it("ignores orders whose stock was never deducted", () => {
    const pending = { status: "new", items: [line(1)], stock_deducted: [] };
    const res = subtractAlreadyDeducted([line(2)], [pending]);
    expect(res.items[0]!.quantity).toBe(2);
    expect(res.adjustments).toHaveLength(0);
  });

  it("ignores cancelled (restocked) orders", () => {
    const cancelled = { ...deductedOrder(1), status: "cancelled" };
    const res = subtractAlreadyDeducted([line(2)], [cancelled]);
    expect(res.items[0]!.quantity).toBe(2);
  });

  it("leaves unrelated lines untouched", () => {
    const other = { product_name: "تيشيرت", color: "أحمر", size: "L", quantity: 1 };
    const res = subtractAlreadyDeducted([other], [deductedOrder(1)]);
    expect(res.items[0]!.quantity).toBe(1);
    expect(res.adjustments).toHaveLength(0);
  });
});
