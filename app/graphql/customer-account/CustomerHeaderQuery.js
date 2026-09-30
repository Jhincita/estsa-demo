// NOTE: https://shopify.dev/docs/api/customer/latest/objects/Customer
export const CUSTOMER_HEADER_QUERY = `#graphql
  query CustomerHeader($language: LanguageCode)
  @inContext(language: $language) {
    customer {
      id
      firstName
      lastName
      displayName
      companyContacts(first: 1) {
        nodes {
          company {
            name
          }
        }
      }
    }
  }
`;
