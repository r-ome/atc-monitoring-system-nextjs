import { BidderRepository } from "src/infrastructure/repositories/bidders.repository";
import {
  BidderSheetRecord,
  BulkBidderInsertSchema,
} from "src/entities/models/Bidder";
import { formatNumberPadding } from "@/app/lib/utils";

export const uploadBiddersUseCase = async (
  branch_id: string,
  data: BidderSheetRecord[]
) => {
  const formatted_data = validateEmptyFields(branch_id, data);
  return await BidderRepository.uploadBidders(formatted_data);
};

const validateEmptyFields = (
  branch_id: string,
  data: BidderSheetRecord[]
): BulkBidderInsertSchema[] => {
  return data.map((item) => {
    const required = [
      "BIDDER_NUMBER",
      "FIRST_NAME",
      "LAST_NAME",
      "SERVICE_CHARGE",
    ] as const;
    const empty_fields = required.filter((field) => !item[field]);

    item.BIDDER_NUMBER = item.BIDDER_NUMBER
      ? formatNumberPadding(item.BIDDER_NUMBER, 4)
      : "NO BIDDER NUMBER";

    if (item.FIRST_NAME) {
      item.FIRST_NAME = item.FIRST_NAME.toUpperCase();
    }
    if (item.MIDDLE_NAME) {
      item.MIDDLE_NAME = item.MIDDLE_NAME.toUpperCase();
    }
    if (item.LAST_NAME) {
      item.LAST_NAME = item.LAST_NAME.toUpperCase();
    }

    if (item.SERVICE_CHARGE) {
      item.SERVICE_CHARGE = (
        parseInt(item.SERVICE_CHARGE, 10) * 100
      ).toString();
    }

    if (!item.REGISTRATION_FEE) {
      item.REGISTRATION_FEE = "0";
    }

    if (item.BIRTHDATE) {
      const formattedDate = new Date(item.BIRTHDATE);
      if (!Number.isNaN(formattedDate.getTime())) {
        item.BIRTHDATE = formattedDate.toISOString();
      } else {
        item.BIRTHDATE = "";
      }
    }

    if (item.CONTACT_NUMBER) {
      item.CONTACT_NUMBER = item.CONTACT_NUMBER.toString();
    }

    if (!empty_fields.length) {
      return { ...item, isValid: true, branch_id, error: "" };
    }

    return {
      ...item,
      branch_id,
      isValid: false,
      error: `Required Fields: ${empty_fields.join(", ")}`,
    };
  });
};
