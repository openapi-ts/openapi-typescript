namespace OpenAPI2 {
  export interface ValueProp {
    // Heading of a value proposition.
    header: string;
    // Body of a value proposition.
    body: string;
  }
  export interface UpdateProviderBody {
    teamId?: string;
    label?: string;
    name?: string;
    logoUrl?: string;
    supportEmail?: string;
    documentationUrl?: string;
  }
  export interface UpdateProvider {
    id: string;
    body: UpdateProviderBody;
  }
  export interface UpdateProductBody {
    name?: string;
    logoUrl?: string;
    listing?: ProductListing;
    // 140 character sentence positioning the product.
    tagline?: string;
    // A list of value propositions of the product.
    valueProps?: ValueProp[];
    images?: string[];
    supportEmail?: string;
    documentationUrl?: string;
    // URL to this Product's Terms of Service. If provided is true, then
    // a url must be set. Otherwise, provided is false.
    termsUrl?: string;
    featureTypes?: FeatureType[];
    integration?: UpdateProductBodyIntegration;
    tags?: string[];
  }
  export interface UpdateProductBodyIntegration {
    provisioning?: string;
    baseUrl?: string;
    ssoUrl?: string;
    version?: UpdateProductBodyIntegrationVersion;
    features?: ProductIntegrationFeatures;
  }
  export enum UpdateProductBodyIntegrationVersion {
    V1 = 'v1'
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
    hasResizeConstraints?: boolean;
    resizableTo?: string[];
    // Array of Region IDs
    regions?: string[];
    // Array of Feature Values
    features?: FeatureValue[];
    // The number of days a user gets as a free trial when subscribing to
    // this plan. Trials are valid only once per product; changing plans
    // or adding an additional subscription will not start a new trial.
    trialDays?: number;
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
    type: RegionType;
    version: RegionVersion;
    body: RegionBody;
  }
  export enum RegionVersion {
    Version1 = 1
  }
  export enum RegionType {
    Region = 'region'
  }
  export interface ProviderBody {
    teamId: string;
    label: string;
    name: string;
    logoUrl?: string;
    supportEmail?: string;
    documentationUrl?: string;
  }
  export interface Provider {
    id: string;
    version: ProviderVersion;
    type: ProviderType;
    body: ProviderBody;
  }
  export enum ProviderType {
    Provider = 'provider'
  }
  export enum ProviderVersion {
    Version1 = 1
  }
  export interface ProductTags {}
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
    accessCode?: boolean;
    // Represents whether or not this product supports Single
    // Sign On
    sso?: boolean;
    // Represents whether or not this product supports changing
    // the plan of a resource.
    planChange?: boolean;
    // Describes how the region for a resource is specified, if
    // unspecified, then regions have no impact on this
    // resource.
    region?: ProductIntegrationFeaturesRegion;
  }
  export enum ProductIntegrationFeaturesRegion {
    UserSpecified = 'user-specified',
    Unspecified = 'unspecified'
  }
  export interface ProductBody {
    providerId: string;
    // Product labels are globally unique and contain the provider name.
    label: string;
    name: string;
    state: string;
    listing: ProductListing;
    logoUrl: string;
    // 140 character sentence positioning the product.
    tagline: string;
    // A list of value propositions of the product.
    valueProps: ValueProp[];
    images: string[];
    supportEmail: string;
    documentationUrl: string;
    // URL to this Product's Terms of Service. If provided is true, then
    // a url must be set. Otherwise, provided is false.
    terms: ProductBodyTerms;
    featureTypes: FeatureType[];
    billing: ProductBodyBilling;
    integration: ProductBodyIntegration;
    tags?: string[];
  }
  export interface ProductBodyIntegration {
    provisioning: string;
    baseUrl: string;
    ssoUrl?: string;
    version: ProductBodyIntegrationVersion;
    features: ProductIntegrationFeatures;
  }
  export enum ProductBodyIntegrationVersion {
    V1 = 'v1'
  }
  export interface ProductBodyBilling {
    type: ProductBodyBillingType;
    currency: ProductBodyBillingCurrency;
  }
  export enum ProductBodyBillingCurrency {
    Usd = 'usd'
  }
  export enum ProductBodyBillingType {
    MonthlyProrated = 'monthly-prorated',
    MonthlyAnniversary = 'monthly-anniversary',
    AnnualAnniversary = 'annual-anniversary'
  }
  export interface ProductBodyTerms {
    url?: string;
    provided: boolean;
  }
  export interface Product {
    id: string;
    version: ProductVersion;
    type: ProductType;
    body: ProductBody;
  }
  export enum ProductType {
    Product = 'product'
  }
  export enum ProductVersion {
    Version1 = 1
  }
  export interface PlanResizeList {}
  export interface PlanBody {
    providerId: string;
    productId: string;
    name: string;
    label: string;
    state: string;
    resizableTo?: string[];
    // Array of Region IDs
    regions: string[];
    // Array of Feature Values
    features: FeatureValue[];
    // The number of days a user gets as a free trial when subscribing to
    // this plan. Trials are valid only once per product; changing plans
    // or adding an additional subscription will not start a new trial.
    trialDays?: number;
    // Dollar value in cents.
    cost: number;
  }
  export interface Plan {
    id: string;
    version: PlanVersion;
    type: PlanType;
    body: PlanBody;
  }
  export enum PlanType {
    Plan = 'plan'
  }
  export enum PlanVersion {
    Version1 = 1
  }
  export interface FeatureValuesList {}
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
    numericDetails?: FeatureNumericDetails;
  }
  export interface FeatureValueDetailsPrice {
    // Cost is the price in cents that will be added to plan's base cost
    // when this value is selected or is default for the plan.
    // Number features should use the cost range instead.
    cost?: number;
    // When a feature is used to multiply the cost of the plan or of
    // another feature, multiply factor is used for calculation.
    // A feature cannot have both a cost and a multiply factor.
    multiplyFactor?: number;
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
    type: FeatureTypeType;
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
  export enum FeatureTypeType {
    Boolean = 'boolean',
    String = 'string',
    Number = 'number'
  }
  export interface FeatureNumericRange {
    // Defines the end of the range ( inclusive ), from the previous, or 0;
    // where the cost_multiple starts taking effect. If set to -1 this defines the
    // range to infinity, or the maximum integer the system can handle
    // ( whichever comes first ).
    limit?: number;
    // An integer in 10,000,000ths of cents, will be multiplied by the
    // numeric value set in the feature to determine the cost.
    costMultiple?: number;
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
    costRanges?: FeatureNumericRange[];
  }
  export interface FeatureMap {
    [name: string]: any;
  }
  export interface ExpandedProduct {
    id: string;
    version: ExpandedProductVersion;
    type: ExpandedProductType;
    body: ProductBody;
    plans?: ExpandedPlan[];
    provider: Provider;
  }
  export enum ExpandedProductType {
    Product = 'product'
  }
  export enum ExpandedProductVersion {
    Version1 = 1
  }
  export interface ExpandedPlanBody extends PlanBody {
    // An array of feature definitions for the plan, as defined on the Product.
    expandedFeatures?: ExpandedFeature[];
    // A boolean flag that indicates if a plan is free or not based on it's cost and features.
    free?: boolean;
    // Plan cost using its default features plus base cost.
    defaultCost?: number;
    // A boolean flag that indicates if a plan has customizable features.
    customizable?: boolean;
  }
  export interface ExpandedPlan {
    id: string;
    version: ExpandedPlanVersion;
    type: ExpandedPlanType;
    body: ExpandedPlanBody;
  }
  export enum ExpandedPlanType {
    Plan = 'plan'
  }
  export enum ExpandedPlanVersion {
    Version1 = 1
  }
  export interface ExpandedFeature extends FeatureType {
    // The string value set for the feature on the plan, this should only be used if the value property is null.
    valueString?: string;
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
