class EligibilityService {
  /**
   * compare: check if a simple condition is correct for the 2 values passed
   * NB: checks are typeless!
   * TODO: extract this method in a "utils" lib
   *
   * @param {string} condition simple condition to check
   * @param {string} a first value
   * @param {string|number|object} b second value (can be a simple string|number or a complex condition)
   * @returns boolean
   */
  compare(condition, a, b) {
    const subCompare = ([subCondition, subValue]) => this.compare(subCondition, a, subValue)
    switch (condition) {
      case "eq":
        return a == b
      case "gt":
        return a > b
      case "gte":
        return a >= b
      case "lt":
        return a < b
      case "lte":
        return a <= b
      case "in":
        return Array.isArray(b) ? b.includes(a) : false
      case "and":
        return Object.entries(b).every(subCompare)
      case "or":
        return Object.entries(b).some(subCompare)
      default:
        return false
    }
  }

  /**
   * checkSubField: check cart for subfields (when field contains a dot)
   *
   * @param {string} field key of criteria
   * @param {object} condition condition object to be checked
   * @param {object} cart contains data to be checked
   * @returns {object}
   */
  checkSubField(field, condition, cart) {
    const [fieldStart, ...fieldOthers] = field.split(/\./g)

    // field must be in cart:
    if (!(fieldStart in cart)) return false

    // we search in object or array, so if cart is not array, make it one:
    const subCart = Array.isArray(cart[fieldStart]) ? cart[fieldStart] : [cart[fieldStart]]

    // one of the elements in cart array must match criteria:
    return Object.values(subCart).some((subCartElement) =>
      this.checkCondition(fieldOthers.join("."), condition, subCartElement)
    )
  }

  /**
   * checkCondition: will check field to apply condition check:
   * - if it has a sub object, parse it with checkSubField
   * - fails if it field does not exist in cart
   * - otherwise, check it with "compare" method
   *
   * @param {string} field key of criteria
   * @param {object} condition condition object to be checked
   * @param {object} cart containing data to be checked
   * @returns {boolean}
   */
  checkCondition(field, condition, cart) {
    // subfield in creteria must be dealt in a different way:
    if (field.includes(".")) return this.checkSubField(field, condition, cart)

    // field must exist in cart:
    if (!(field in cart)) return false

    // Objects have complex checks:
    if (typeof condition === "object")
      return Object.entries(condition).every(([simpleCondition, simpleValue]) =>
        this.compare(simpleCondition, cart[field], simpleValue)
      )

    // last case, condition should be a string or integer
    return this.compare("eq", cart[field], condition)
  }

  /**
   * Compare cart data with criteria to compute eligibility.
   * If all criteria are fulfilled then the cart is eligible (return true).
   *
   * @param {object} cart
   * @param {object} criteria
   * @return {boolean}
   */
  isEligible(cart, criteria) {
    try {
      // all criteria conditions must be true in order to validate cart:
      return Object.entries(criteria).every(([field, condition]) => {
        return this.checkCondition(field, condition, cart)
      })
    } catch (e) {
      console.error("[isEligible] unknown error: ", e)
      return false
    }
  }
}

module.exports = {
  EligibilityService,
}
