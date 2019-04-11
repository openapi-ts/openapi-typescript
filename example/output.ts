export namespace OpenAPI2 {
  export interface ValueProp {
    // Heading of a value proposition.
    header: string;
    // Body of a value proposition.
    body: string;
  }
  export interface UpdateProviderBody {
    team_id?: string;
    label?: string;
    name?: string;
    logo_url?: string;
    support_email?: string;
    documentation_url?: string;
  }
  export interface UpdateProvider {
    id: string;
    body: UpdateProviderBody;
  }
  export interface UpdateProductBody {
    name?: string;
    logo_url?: string;
    listing?: ProductListing;
    // 140 character sentence positioning the product.
    tagline?: string;
    // A list of value propositions of the product.
    value_props?: ValueProp[];
    images?: string[];
    support_email?: string;
    documentation_url?: string;
    // URL to this Product's Terms of Service. If provided is true, then
    // a url must be set. Otherwise, provided is false.
    terms_url?: string;
    feature_types?: FeatureType[];
    integration?: UpdateProductBodyIntegration;
    tags?: string[];
  }
  export interface UpdateProductBodyIntegration {
    provisioning?: string;
    base_url?: string;
    sso_url?: string;
    version?: 'v1';
    features?: ProductIntegrationFeatures;
  }
  export interface UpdateProduct {
    id: string;
    body: UpdateProductBody;
  }
  export interface UpdatePlanBody {
    name?: string;
    label?: string;
    state?: string;
    // Used in conjuction with resizable_to to set or unset the list
    has_resize_constraints?: boolean;
    resizable_to?: string[];
    // Array of Region IDs
    regions?: string[];
    // Array of Feature Values
    features?: FeatureValue[];
    // The number of days a user gets as a free trial when subscribing to
    // this plan. Trials are valid only once per product; changing plans
    // or adding an additional subscription will not start a new trial.
    trial_days?: number;
    // Dollar value in cents
    cost?: number;
  }
  export interface UpdatePlan {
    id: string;
    body: UpdatePlanBody;
  }
  export interface RegionBody {
    platform: string;
    location: string;
    name: string;
    priority: number;
  }
  export interface Region {
    id: string;
    type: 'region';
    version: 1;
    body: RegionBody;
  }
  export interface ProviderBody {
    team_id: string;
    label: string;
    name: string;
    logo_url?: string;
    support_email?: string;
    documentation_url?: string;
  }
  export interface Provider {
    id: string;
    version: 1;
    type: 'provider';
    body: ProviderBody;
  }
  export interface ProductListing {
    // When true, everyone can see the product when requested. When false it will
    // not be visible to anyone except those on the provider team.
    public?: boolean;
    // When true, the product will be displayed in product listings alongside
    // other products. When false the product will be excluded from listings,
    // but can still be provisioned directly if it's label is known.
    // Any pages that display information about the product when not listed,
    // should indicate to webcrawlers that the content should not be indexed.
    listed?: boolean;
    // Object to hold various flags for marketing purposes only. These are values
    // that need to be stored, but should not affect decision making in code. If
    // we find ourselves in a position where we think they should, we should
    // consider refactoring our listing definition.
    marketing?: ProductListingMarketing;
  }
  export interface ProductListingMarketing {
    // Indicates whether or not the product is in `Beta` and should be
    // advertised as such. This does not have any impact on who can access the
    // product, it is just used to inform consumers through our clients.
    beta?: boolean;
    // Indicates whether or not the product is in `New` and should be
    // advertised as such. This does not have any impact on who can access the
    // product, it is just used to inform consumers through our clients.
    new?: boolean;
    // Indicates whether or not the product is in `New` and should be
    // advertised as such. This does not have any impact on who can access the
    // product, it is just used to inform consumers through our clients.
    featured?: boolean;
  }
  export interface ProductIntegrationFeatures {
    // Indicates whether or not this product supports resource transitions to
    // manifold by access_code.
    access_code?: boolean;
    // Represents whether or not this product supports Single
    // Sign On
    sso?: boolean;
    // Represents whether or not this product supports changing
    // the plan of a resource.
    plan_change?: boolean;
    // Describes how the region for a resource is specified, if
    // unspecified, then regions have no impact on this
    // resource.
    region?: 'user-specified' | 'unspecified';
  }
  export interface ProductBody {
    provider_id: string;
    // Product labels are globally unique and contain the provider name.
    label: string;
    name: string;
    state: string;
    listing: ProductListing;
    logo_url: string;
    // 140 character sentence positioning the product.
    tagline: string;
    // A list of value propositions of the product.
    value_props: ValueProp[];
    images: string[];
    support_email: string;
    documentation_url: string;
    // URL to this Product's Terms of Service. If provided is true, then
    // a url must be set. Otherwise, provided is false.
    terms: ProductBodyTerms;
    feature_types: FeatureType[];
    billing: ProductBodyBilling;
    integration: ProductBodyIntegration;
    tags?: string[];
  }
  export interface ProductBodyIntegration {
    provisioning: string;
    base_url: string;
    sso_url?: string;
    version: 'v1';
    features: ProductIntegrationFeatures;
  }
  export interface ProductBodyBilling {
    type: 'monthly-prorated' | 'monthly-anniversary' | 'annual-anniversary';
    currency: 'usd';
  }
  export interface ProductBodyTerms {
    url?: string;
    provided: boolean;
  }
  export interface Product {
    id: string;
    version: 1;
    type: 'product';
    body: ProductBody;
  }
  export interface PlanBody {
    provider_id: string;
    product_id: string;
    name: string;
    label: string;
    state: string;
    resizable_to?: string[];
    // Array of Region IDs
    regions: string[];
    // Array of Feature Values
    features: FeatureValue[];
    // The number of days a user gets as a free trial when subscribing to
    // this plan. Trials are valid only once per product; changing plans
    // or adding an additional subscription will not start a new trial.
    trial_days?: number;
    // Dollar value in cents.
    cost: number;
  }
  export interface Plan {
    id: string;
    version: 1;
    type: 'plan';
    body: PlanBody;
  }
  export interface FeatureValueDetails {
    label: string;
    name: string;
    // The cost that will be added to the monthly plan cost when this value
    // is selected or is default for the plan.
    // Cost is deprecated in favor of the `price.cost` field.
    cost?: number;
    // Price describes the cost of a feature. It should be preferred over
    // the `cost` property.
    price?: FeatureValueDetailsPrice;
    numeric_details?: FeatureNumericDetails;
  }
  export interface FeatureValueDetailsPrice {
    // Cost is the price in cents that will be added to plan's base cost
    // when this value is selected or is default for the plan.
    // Number features should use the cost range instead.
    cost?: number;
    // When a feature is used to multiply the cost of the plan or of
    // another feature, multiply factor is used for calculation.
    // A feature cannot have both a cost and a multiply factor.
    multiply_factor?: number;
    // Price describes how the feature cost should be calculated.
    formula?: string;
    // Description explains how a feature is calculated to the user.
    description?: string;
  }
  export interface FeatureValue {
    feature: string;
    value: string;
  }
  export interface FeatureType {
    label: string;
    name: string;
    type: 'boolean' | 'string' | 'number';
    // This sets whether or not the feature can be customized by a consumer.
    customizable?: boolean;
    // This sets whether or not the feature can be upgraded by the consumer after the
    // resource has provisioned. Upgrading means setting a higher value or selecting a
    // higher element in the list.
    upgradable?: boolean;
    // This sets whether or not the feature can be downgraded by the consumer after the
    // resource has provisioned. Downgrading means setting a lower value or selecting a
    // lower element in the list.
    downgradable?: boolean;
    // Sets if this feature’s value is trackable from the provider,
    // this only really affects numeric constraints.
    measurable?: boolean;
    values?: FeatureValueDetails[];
  }
  export interface FeatureNumericRange {
    // Defines the end of the range ( inclusive ), from the previous, or 0;
    // where the cost_multiple starts taking effect. If set to -1 this defines the
    // range to infinity, or the maximum integer the system can handle
    // ( whichever comes first ).
    limit?: number;
    // An integer in 10,000,000ths of cents, will be multiplied by the
    // numeric value set in the feature to determine the cost.
    cost_multiple?: number;
  }
  export interface FeatureNumericDetails {
    // Sets the increment at which numbers can be selected if customizable, by
    // default this is 1; for example, setting this to 8 would only allow integers
    // in increments of 8 ( 0, 8, 16, ... ). This property is not used if the
    // feature is measurable; except if it is set to 0, setting the increment to 0
    // means this numeric details has no scale, and will not be or customizable.
    // Some plans may not have a measureable or customizable feature.
    increment?: number;
    // Minimum value that can be set by a user if customizable
    min?: number;
    // Maximum value that can be set by a user if customizable
    max?: number;
    // Applied to the end of the number for display, for example the ‘GB’ in ‘20 GB’.
    suffix?: string;
    cost_ranges?: FeatureNumericRange[];
  }
  export interface FeatureMap {
    [name: string]: any;
  }
  export interface ExpandedProduct {
    id: string;
    version: 1;
    type: 'product';
    body: ProductBody;
    plans?: ExpandedPlan[];
    provider: Provider;
  }
  export interface ExpandedPlanBody extends PlanBody {
    // An array of feature definitions for the plan, as defined on the Product.
    expanded_features?: ExpandedFeature[];
    // A boolean flag that indicates if a plan is free or not based on it's cost and features.
    free?: boolean;
    // Plan cost using its default features plus base cost.
    defaultCost?: number;
    // A boolean flag that indicates if a plan has customizable features.
    customizable?: boolean;
  }
  export interface ExpandedPlan {
    id: string;
    version: 1;
    type: 'plan';
    body: ExpandedPlanBody;
  }
  export interface ExpandedFeature extends FeatureType {
    // The string value set for the feature on the plan, this should only be used if the value property is null.
    value_string?: string;
    value?: FeatureValueDetails;
  }
  export interface Error {
    // The error type
    type: string;
    // Explanation of the errors
    message: string[];
  }
  export interface Credentials {
    [name: string]: string;
  }
  export interface CreateRegion {
    body: RegionBody;
  }
  export interface CreateProvider {
    body: ProviderBody;
  }
  export interface CreateProduct {
    body: ProductBody;
  }
  export interface CreatePlan {
    body: PlanBody;
  }
}
