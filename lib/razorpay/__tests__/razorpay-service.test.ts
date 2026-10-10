import { describe, expect, it } from "vitest";
import { formatCustomerPhoneForRazorpay } from "@/lib/razorpay/razorpay-service";
import { createBookingSchema } from "@/modules/bookings/bookings.schemas";

describe("Razorpay Phone Number Normalization for Verification", () => {
  it("formats standard 10-digit Indian mobile number to E.164 format with +91 prefix", () => {
    expect(formatCustomerPhoneForRazorpay("9876543210")).toBe("+919876543210");
  });

  it("handles leading 0 prefix correctly", () => {
    expect(formatCustomerPhoneForRazorpay("09876543210")).toBe("+919876543210");
  });

  it("handles 91 prefix without plus", () => {
    expect(formatCustomerPhoneForRazorpay("919876543210")).toBe("+919876543210");
  });

  it("cleans spaces and special characters from phone numbers", () => {
    expect(formatCustomerPhoneForRazorpay("+91 98765 43210")).toBe("+919876543210");
    expect(formatCustomerPhoneForRazorpay("+91-98765-43210")).toBe("+919876543210");
  });

  it("gracefully handles undefined or empty phone numbers", () => {
    expect(formatCustomerPhoneForRazorpay(undefined)).toBeUndefined();
    expect(formatCustomerPhoneForRazorpay("")).toBeUndefined();
  });
});

describe("Booking Schema Payment Method Integration", () => {
  const baseBooking = {
    carId: "car_123",
    customer: {
      firstName: "Rahul",
      lastName: "Sharma",
      email: "rahul@example.com",
      phone: "9876543210",
    },
    pickupDateTime: new Date("2026-11-01T10:00:00Z"),
    dropDateTime: new Date("2026-11-03T10:00:00Z"),
  };

  it("defaults paymentMethod to PICKUP if not specified", () => {
    const parsed = createBookingSchema.parse(baseBooking);
    expect(parsed.paymentMethod).toBe("PICKUP");
  });

  it("accepts ONLINE payment method for Razorpay link flow", () => {
    const parsed = createBookingSchema.parse({
      ...baseBooking,
      paymentMethod: "ONLINE",
    });
    expect(parsed.paymentMethod).toBe("ONLINE");
  });
});
