import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const MOTION_EASE = [0.16, 1, 0.3, 1];

const FAQ_ITEMS = [
  {
    question: "How long does verification take?",
    answer:
      "Verification usually takes 1–24 hours during business hours. Once your payment is confirmed by the bank, we'll notify you immediately via email and WhatsApp.",
  },
  {
    question: "Can I upload another receipt?",
    answer:
      "Yes. If your payment is still pending review, you can replace the uploaded receipt with a new one. Simply use the upload area to submit a clearer or updated receipt.",
  },
  {
    question: "What if I transferred the wrong amount?",
    answer:
      "If the transferred amount doesn't match the order total, our team will contact you. You may need to pay the difference or request a refund for the overpayment. Contact support for assistance.",
  },
  {
    question: "Can I cancel my payment?",
    answer:
      "If the payment has not been verified yet, you can contact our support team to request a cancellation. Once verified, the order will proceed to fulfillment and standard cancellation/refund policies apply.",
  },
  {
    question: "What file formats are accepted for the receipt?",
    answer:
      "We accept JPG, JPEG, PNG, and PDF files. The maximum file size is 10 MB. For the fastest verification, ensure the payment reference, amount, and date are clearly visible in the receipt.",
  },
  {
    question: "What happens after my payment is approved?",
    answer:
      "Once approved, your order status will be updated to 'Confirmed' and our team will begin preparing your items for shipment. You'll receive tracking information once your order is dispatched.",
  },
];

const AccordionItem = ({ item, isOpen, onToggle }) => (
  <div className="border-b border-white/5 last:border-0">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-[#F2CA50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2CA50]"
      aria-expanded={isOpen}
    >
      <span
        className={cn(
          "se-body text-sm font-medium transition-colors",
          isOpen ? "text-[#F2CA50]" : "text-[#e5e2e1]"
        )}
      >
        {item.question}
      </span>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-[#574500] transition-transform duration-300",
          isOpen && "rotate-180 text-[#F2CA50]"
        )}
      />
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: MOTION_EASE }}
          className="overflow-hidden"
        >
          <p className="se-body pb-5 text-sm leading-6 text-[#99907c]">
            {item.answer}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const PaymentFAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: MOTION_EASE, delay: 0.4 }}
      className="rounded-[24px] border border-white/10 bg-[#0d0d0d] p-6 sm:p-8"
      aria-label="Frequently asked questions"
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <HelpCircle className="h-5 w-5 text-[#d0c5af]" />
        </div>
        <div>
          <h3 className="se-serif text-lg text-[#e5e2e1]">
            Frequently Asked Questions
          </h3>
          <p className="se-label text-[8px] tracking-[0.25em] text-[#574500]">
            Common payment queries
          </p>
        </div>
      </div>

      {/* Accordion */}
      <div className="mt-2">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem
            key={item.question}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default PaymentFAQ;
