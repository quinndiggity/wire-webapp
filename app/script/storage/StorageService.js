/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

'use strict';

window.z = window.z || {};
window.z.storage = z.storage || {};

z.storage.StorageService = class StorageService {
  static get OBJECT_STORE() {
    return {
      AMPLIFY: 'amplify',
      CLIENTS: 'clients',
      CONVERSATION_EVENTS: 'conversation_events',
      CONVERSATIONS: 'conversations',
      EVENTS: 'events',
      KEYS: 'keys',
      PRE_KEYS: 'prekeys',
      SESSIONS: 'sessions',
    };
  }

  /**
   * Construct an new StorageService.
   * @returns {StorageService} Service to interface with persistent storage
   */
  constructor() {
    this.logger = new z.util.Logger('z.storage.StorageService', z.config.LOGGER.OPTIONS);

    this.db = undefined;
    this.db_name = undefined;
    this.user_id = undefined;

    return this;
  }

  //##############################################################################
  // Initialization
  //##############################################################################

  /**
   * Initialize the IndexedDB for a user.
   *
   * @param {string} user_id - User ID
   * @returns {Promise} Resolves with the database name
   */
  init(user_id = this.user_id) {
    return new Promise((resolve, reject) => {
      const is_permanent = z.util.StorageUtil.get_value(z.storage.StorageKey.AUTH.PERSIST);
      const client_type = is_permanent ? z.client.ClientType.PERMANENT : z.client.ClientType.TEMPORARY;

      this.user_id = user_id;
      this.db_name = `wire@${z.util.Environment.backend.current}@${user_id}@${client_type}`;

      // https://github.com/dfahlander/Dexie.js/wiki/Version.stores()
      const version_1 = {
        [z.storage.StorageService.OBJECT_STORE.AMPLIFY]: '',
        [z.storage.StorageService.OBJECT_STORE.CLIENTS]: '',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATION_EVENTS]: ', raw.conversation, raw.time, meta.timestamp',
        [z.storage.StorageService.OBJECT_STORE.KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.PRE_KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.SESSIONS]: '',
      };

      const version_2 = {
        [z.storage.StorageService.OBJECT_STORE.AMPLIFY]: '',
        [z.storage.StorageService.OBJECT_STORE.CLIENTS]: '',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATION_EVENTS]: ', raw.conversation, raw.time, raw.type, meta.timestamp',
        [z.storage.StorageService.OBJECT_STORE.KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.PRE_KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.SESSIONS]: '',
      };

      const version_3 = {
        [z.storage.StorageService.OBJECT_STORE.AMPLIFY]: '',
        [z.storage.StorageService.OBJECT_STORE.CLIENTS]: '',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATION_EVENTS]: ', raw.conversation, raw.time, raw.type, meta.timestamp',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATIONS]: ', id, last_event_timestamp',
        [z.storage.StorageService.OBJECT_STORE.KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.PRE_KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.SESSIONS]: '',
      };

      const version_4 = {
        [z.storage.StorageService.OBJECT_STORE.AMPLIFY]: '',
        [z.storage.StorageService.OBJECT_STORE.CLIENTS]: ', meta.primary_key',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATION_EVENTS]: ', raw.conversation, raw.time, raw.type, meta.timestamp',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATIONS]: ', id, last_event_timestamp',
        [z.storage.StorageService.OBJECT_STORE.KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.PRE_KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.SESSIONS]: '',
      };

      const version_5 = {
        [z.storage.StorageService.OBJECT_STORE.AMPLIFY]: '',
        [z.storage.StorageService.OBJECT_STORE.CLIENTS]: ', meta.primary_key',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATION_EVENTS]: ', conversation, time, type',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATIONS]: ', id, last_event_timestamp',
        [z.storage.StorageService.OBJECT_STORE.KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.PRE_KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.SESSIONS]: '',
      };

      const version_9 = {
        [z.storage.StorageService.OBJECT_STORE.AMPLIFY]: '',
        [z.storage.StorageService.OBJECT_STORE.CLIENTS]: ', meta.primary_key',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATION_EVENTS]: ', conversation, time, type, [conversation+time]',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATIONS]: ', id, last_event_timestamp',
        [z.storage.StorageService.OBJECT_STORE.KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.PRE_KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.SESSIONS]: '',
      };

      const version_10 = {
        [z.storage.StorageService.OBJECT_STORE.AMPLIFY]: '',
        [z.storage.StorageService.OBJECT_STORE.CLIENTS]: ', meta.primary_key',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATION_EVENTS]: ', category, conversation, time, type, [conversation+time], [conversation+category]',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATIONS]: ', id, last_event_timestamp',
        [z.storage.StorageService.OBJECT_STORE.KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.PRE_KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.SESSIONS]: '',
      };

      const version_11 = {
        [z.storage.StorageService.OBJECT_STORE.AMPLIFY]: '',
        [z.storage.StorageService.OBJECT_STORE.CLIENTS]: ', meta.primary_key',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATION_EVENTS]: ', category, conversation, time, type, [conversation+time], [conversation+category]',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATIONS]: ', id, last_event_timestamp',
        [z.storage.StorageService.OBJECT_STORE.KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.PRE_KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.SESSIONS]: '',
      };

      const version_12 = {
        [z.storage.StorageService.OBJECT_STORE.AMPLIFY]: '',
        [z.storage.StorageService.OBJECT_STORE.CLIENTS]: ', meta.primary_key',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATION_EVENTS]: ', category, conversation, time, type, [conversation+time], [conversation+category]',
        [z.storage.StorageService.OBJECT_STORE.CONVERSATIONS]: ', id, last_event_timestamp',
        [z.storage.StorageService.OBJECT_STORE.EVENTS]: '++primary_key, id, category, conversation, time, type, [conversation+time], [conversation+category]',
        [z.storage.StorageService.OBJECT_STORE.KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.PRE_KEYS]: '',
        [z.storage.StorageService.OBJECT_STORE.SESSIONS]: '',
      };

      this.db = new Dexie(this.db_name);

      this.db.on('blocked', () => {
        return this.logger.error('Database is blocked');
      });

      // @see https://github.com/dfahlander/Dexie.js/wiki/Version.upgrade()
      // @see https://github.com/dfahlander/Dexie.js/wiki/WriteableCollection.modify()
      this.db.version(1).stores(version_1);
      this.db.version(2).stores(version_2);
      this.db.version(3).stores(version_3);
      this.db.version(4).stores(version_4)
      .upgrade((transaction) => {
        this.logger.warn('Database upgrade to version 4', transaction);
        transaction[z.storage.StorageService.OBJECT_STORE.CLIENTS].toCollection().modify(function(client) {
          return client.meta = {
            is_verified: true,
            primary_key: 'local_identity',
          };
        });
      });
      this.db.version(5).stores(version_4);
      this.db.version(6).stores(version_4)
      .upgrade((transaction) => {
        this.logger.warn('Database upgrade to version 6', transaction);
        transaction[z.storage.StorageService.OBJECT_STORE.CONVERSATIONS].toCollection()
        .eachKey((key) => {
          this.db[z.storage.StorageService.OBJECT_STORE.CONVERSATIONS].update(key, {id: key});
        });
        transaction[z.storage.StorageService.OBJECT_STORE.SESSIONS].toCollection()
        .eachKey((key) => {
          this.db[z.storage.StorageService.OBJECT_STORE.SESSIONS].update(key, {id: key});
        });
        transaction[z.storage.StorageService.OBJECT_STORE.PRE_KEYS].toCollection()
        .eachKey((key) => {
          this.db[z.storage.StorageService.OBJECT_STORE.PRE_KEYS].update(key, {id: key});
        });
      });
      this.db.version(7).stores(version_5)
      .upgrade((transaction) => {
        this.logger.warn('Database upgrade to version 7', transaction);
        transaction[z.storage.StorageService.OBJECT_STORE.CONVERSATION_EVENTS].toCollection()
        .modify(function(event) {
          const mapped_event = event.mapped || event.raw;
          delete event.mapped;
          delete event.raw;
          delete event.meta;
          $.extend(event, mapped_event);
        });
      });
      this.db.version(8).stores(version_5)
      .upgrade((transaction) => {
        this.logger.warn('Database upgrade to version 8', transaction);
        transaction[z.storage.StorageService.OBJECT_STORE.CONVERSATION_EVENTS].toCollection()
        .modify(function(event) {
          if (event.type === z.event.Client.CONVERSATION.DELETE_EVERYWHERE) {
            event.time = new Date(event.time).toISOString();
          }
        });
      });
      this.db.version(9).stores(version_9);
      this.db.version(10).stores(version_10)
      .upgrade((transaction) => {
        this.logger.warn('Database upgrade to version 10', transaction);
        transaction[z.storage.StorageService.OBJECT_STORE.CONVERSATION_EVENTS].toCollection()
        .modify(function(event) {
          event.category = z.message.MessageCategorization.category_from_event(event);
        });
      });
      this.db.version(11).stores(version_11)
      .upgrade((transaction) => {
        this.logger.warn('Database upgrade to version 11', transaction);
        const expected_primary_key = z.client.ClientRepository.PRIMARY_KEY_CURRENT_CLIENT;
        transaction[z.storage.StorageService.OBJECT_STORE.CLIENTS].toCollection()
        .each((client, cursor) => {
          if ((client.meta.primary_key === expected_primary_key) && (client.primary_key !== expected_primary_key)) {
            transaction[z.storage.StorageService.OBJECT_STORE.CLIENTS].delete(cursor.primaryKey);
            transaction[z.storage.StorageService.OBJECT_STORE.CLIENTS].put(client, expected_primary_key);
          }
        });
      });
      this.db.version(12).stores(version_11)
      .upgrade((transaction) => {
        this.logger.warn('Database upgrade to version 12', transaction);
        transaction[z.storage.StorageService.OBJECT_STORE.KEYS].toCollection()
        .modify(function(record) {
          return record.serialised = z.util.base64_to_array(record.serialised).buffer;
        });
        transaction[z.storage.StorageService.OBJECT_STORE.PRE_KEYS].toCollection()
        .modify(function(record) {
          return record.serialised = z.util.base64_to_array(record.serialised).buffer;
        });
        transaction[z.storage.StorageService.OBJECT_STORE.SESSIONS].toCollection()
        .modify(function(record) {
          return record.serialised = z.util.base64_to_array(record.serialised).buffer;
        });
      });
      this.db.version(13).stores(version_12)
      .upgrade((transaction) => {
        this.logger.warn('Database upgrade to version 13', transaction);
        transaction[z.storage.StorageService.OBJECT_STORE.CONVERSATION_EVENTS].toCollection().toArray()
        .then((items) => {
          this.db[z.storage.StorageService.OBJECT_STORE.EVENTS].bulkPut(items);
        });
      });

      return this.db.open()
      .then(() => {
        this.logger.info(`Storage Service initialized with database '${this.db_name}' version '${this.db.verno}'`);
        return resolve(this.db_name);
      })
      .catch((error) => {
        this.logger.error(`Failed to initialize database '${this.db_name}' for Storage Service: ${error.message || error}`, {error});
        return reject(new z.storage.StorageError(z.storage.StorageError.TYPE.FAILED_TO_OPEN));
      });
    });
  }


  //##############################################################################
  // Interactions
  //##############################################################################

  /**
   * Clear all stores.
   * @returns {Promise} Resolves when all stores have been cleared
   */
  clear_all_stores() {
    return Promise.all(Array.from(this.db._dbSchema).map((store_name) => this.delete_store(store_name)));
  }

  /**
   * Removes persisted data.
   *
   * @param {string} store_name - Name of the object store
   * @param {string} primary_key - Primary key
   * @returns {Promise} Resolves when the object is deleted
   */
  delete(store_name, primary_key) {
    return new Promise((resolve, reject) => {
      if (this.db[store_name]) {
        return this.db[store_name].delete(primary_key)
        .then(() => {
          this.logger.info(`Deleted '${primary_key}' from object store '${store_name}'`);
          resolve(primary_key);
        })
        .catch((error) => {
          this.logger.error(`Failed to delete '${primary_key}' from store '${store_name}'`, error);
          reject(error);
        });
      }
      return reject(new z.storage.StorageError(z.storage.StorageError.TYPE.DATA_STORE_NOT_FOUND));
    });
  }

  /**
   * Delete the IndexedDB with all its stores.
   * @returns {Promise} Resolves if a database is found and cleared
   */
  delete_everything() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        return this.db.delete()
        .then(() => {
          this.logger.info(`Clearing IndexedDB '${this.db_name}' successful`);
          resolve(true);
        })
        .catch((error) => {
          this.logger.error(`Clearing IndexedDB '${this.db_name}' failed`);
          reject(error);
        });
      }
      this.logger.error(`IndexedDB '${this.db_name}' not found`);
      resolve(true);
    });
  }

  /**
   * Delete a database store.
   * @param {String} store_name - Name of database store to delete
   * @returns {Promise} Resolves when the store has been deleted
   */
  delete_store(store_name) {
    this.logger.info(`Clearing object store '${store_name}' in database '${this.db_name}'`);
    return this.db[store_name].clear();
  }

  /**
   * Delete multiple database stores.
   * @param {Array<String>} store_names - Names of database stores to delete
   * @returns {Promise} Resolves when the stores have been deleted
   */
  delete_stores(store_names) {
    return Promise.all(store_names.map((store_name) => this.delete_store(store_name)));
  }

  /**
   * Returns an array of all records for a given object store.
   *
   * @param {string} store_name - Name of object store
   * @returns {Promise} Resolves with the records from the object store
   */
  get_all(store_name) {
    return this.db[store_name].toArray()
    .catch((error) => {
      this.logger.error(`Failed to load objects from store '${store_name}'`, error);
      throw error;
    });
  }

  /**
   * Loads persisted data via a promise.
   * @note If a key cannot be found, it resolves and returns "undefined".
   *
   * @param {string} store_name - Name of object store
   * @param {string} primary_key - Primary key of object to be retrieved
   * @returns {Promise} Resolves with the record matching the primary key
   */
  load(store_name, primary_key) {
    return this.db[store_name].get(primary_key)
    .catch((error) => {
      this.logger.error(`Failed to load '${primary_key}' from store '${store_name}'`, error);
      throw error;
    });
  }

  /**
   * Saves objects in the local database.
   *
   * @param {string} store_name - Name of object store where to save the object
   * @param {string} primary_key - Primary key which should be used to store the object
   * @param {Object} entity - Data to store in object store
   * @returns {Promise} Resolves with the primary key of the persisted object
   */
  save(store_name, primary_key, entity) {
    return this.db[store_name].put(entity, primary_key)
    .catch((error) => {
      this.logger.error(`Failed to put '${primary_key}' into store '${store_name}'`, error);
      throw error;
    });
  }

  /**
   * Closes the database. This operation completes immediately and there is no returned Promise.
   * @see https://github.com/dfahlander/Dexie.js/wiki/Dexie.close()
   * @param {String} [reason='unknown reason'] - Cause for the termination
   * @returns {undefined} No return value
   */
  terminate(reason = 'unknown reason') {
    this.logger.info(`Closing database connection with '${this.db.name}' because of '${reason}'.`);
    this.db.close();
  }

  /**
   * Update previously persisted data via a promise.
   *
   * @param {string} store_name - Name of object store
   * @param {string} primary_key - Primary key of object to be updated
   * @param {Object} changes - Object containing the key paths to each property you want to change
   * @returns {Promise} Promise with the number of updated records (0 if no records were changed).
   */
  update(store_name, primary_key, changes) {
    return this.db[store_name].update(primary_key, changes)
    .then((number_of_updates) => {
      this.logger.info(`Updated ${number_of_updates} record(s) with key '${primary_key}' in store '${store_name}'`, changes);
      return number_of_updates;
    })
    .catch((error) => {
      this.logger.error(`Failed to update '${primary_key}' in store '${store_name}'`, error);
      throw error;
    });
  }
};
