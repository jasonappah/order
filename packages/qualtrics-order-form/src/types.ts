export type CostCenter =
  | {
      type: 'Student Organization Cost Center' | 'Jonsson School Student Council funding';
    }
  | {
      type: 'Other';
      value: string;
    };

export type QualtricsFormInputs = {
  netID: string;
  advisor: {
    name: string;
    email: string;
  };
  eventName: string;
  eventDate: string; // MM/DD/YYYY
  costCenter: CostCenter;
};

export type QualtricsOrderPayload = {
  // Matches packages/order-form/src/generate-order-forms.GenerateOrderFormsInput
  orderData: {
    items: Array<{
      name: string;
      vendor: string;
      quantity: number;
      url: string;
      pricePerUnitCents: number;
      shippingAndHandlingCents: number;
      notes?: string;
    }>;
    justification?: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    project?: string;
    orgName: string;
    requestDate?: string | Date;
  };
  formInputs: QualtricsFormInputs;
};

export type QualtricsOrderSuccess = {
  status: 'success';
  vendorCount: number;
  itemsCount: number;
  truncatedItemsCount: number;
  remainingItemsUploaded: boolean;
};

export type QualtricsOrderError = {
  status: 'error';
  message: string;
  details?: string;
};

export type QualtricsOrderResult = QualtricsOrderSuccess | QualtricsOrderError;

