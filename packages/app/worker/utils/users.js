/**
 * @typedef {import('../../src/types').User} User
 */

export class Users {
  /**
   *
   * @param {KVNamespace} kv
   */
  constructor(kv) {
    this.kv = kv
  }

  /**
   * @param {string} email
   */
  async create(email) {
    // gravatar
    const encoder = new TextEncoder()
    const data = encoder.encode(email)
    const hash = await crypto.subtle.digest('MD5', data)
    const hashArray = [...new Uint8Array(hash)]
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    /** @type { User } */
    const merged = {
      email,
      otp: false,
      gravatar: `https://www.gravatar.com/avatar/${hashHex}`,
    }
    await this.kv.put(email, JSON.stringify(merged))
    return merged
  }

  /**
   * @param {string} key
   * @param {Partial<User>} user
   */
  async put(key, user) {
    const u = await this.kv.get(key)
    if (!u) {
      return new Error('User not found.')
    }

    const parsed = JSON.parse(u)
    const merged = {
      ...parsed,
      ...user,
    }
    await this.kv.put(
      key,
      JSON.stringify({
        ...parsed,
        ...user,
      })
    )
    return /** @type {User} */ (merged)
  }

  /**
   *
   * @param {string} email
   */
  async get(email) {
    const user = await this.kv.get(email, 'json')

    if (!user) {
      return
    }
    return /** @type {User} */ (user)
  }

  /**
   *
   * @param {string} email
   */
  async getOrCreate(email) {
    const user = await this.kv.get(email, 'json')

    if (!user) {
      return await this.create(email)
    }
    return /** @type {User} */ (user)
  }

  /**
   * @param {string} email
   * @param {string} url
   */
  async putOTP(email, url) {
    await this.kv.put(email + '@otp', url)
  }

  /**
   * @param {string} email
   */
  async getOTP(email) {
    return /** @type {string | null} */ (
      await this.kv.get(email + '@otp', 'text')
    )
  }
}
