/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
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
window.z.extension = z.extension || {};

z.extension.GiphyRepository = class GiphyRepository {
  /*
  Construct a new Giphy Repository.
  @param {z.extension.GiphyService} giphy_service - Giphy REST API implementation
  */
  constructor(giphy_service) {
    this.giphy_service = giphy_service;
    this.logger = new z.util.Logger('z.extension.GiphyRepository', z.config.LOGGER.OPTIONS);
    this.gif_query_cache = {};
  }

  /*
  Get random GIF for a word or phrase.

  @param {Object} options
  @param {string} options.tag - search query term or phrase
  @param {number} [options.retry=3] - How many retries to get the correct size. (default 3)
  @param {number} [options.max_size=3 * 1024 * 1024] - Maximum gif size in bytes (default 3MB)
  */
  get_random_gif(options) {
    return new Promise((resolve, reject) => {
      options = Object.assign({
        retry: 3,
        max_size: 3 * 1024 * 1024,
      }, options);

      const _get_random_gif = (retries = 0) => {
        if (options.retry === retries) {
          reject(new Error(`Unable to fetch a proper gif within ${options.retry} retries`));
        }

        return this.giphy_service.get_random(options.tag)
        .then(response => this.giphy_service.get_by_id(response.data.id))
        .then(response => {
          const { images } = response.data;
          const static_gif = images[z.extension.GiphyContentSizes.FIXED_WIDTH_STILL];
          const animation_gif = images[z.extension.GiphyContentSizes.DOWNSIZED];

          if (animation_gif.size > options.max_size) {
            this.logger.info(`Gif size (${animation_gif.size}) is over maximum size (${animation_gif.size})`);
            return _get_random_gif(retries + 1);
          }
          return resolve({
            url: response.data.url,
            static: static_gif.url,
            animated: animation_gif.url,
          });
        })
        .catch(reject);
      };

      return _get_random_gif();
    });
  }

  /*
  Get random GIFs for a word or phrase.

  @param options [Object]
  @param {string} options.query - search query term or phrase
  @param {number} [options.number=6] - amount of GIFs to receive
  @param {number} [options.max_size=3] * 1024 * 1024] - Maximum gif size in bytes
  @param {boolean} [options.random=true] - will return an randomized result
  @param {string} [options.sorting='relevant'] - specify sorting ('relevant' or 'recent' default 'relevant')
  */
  get_gifs(options) {
    return new Promise((resolve, reject) => {
      const result = [];
      let offset = 0;

      options = Object.assign({
        max_size: 3 * 1024 * 1024,
        number: 6,
        random: true,
        sorting: 'relevant',
      }, options);

      if (!options.query) {
        const error = new Error('No query specified');
        this.logger.error(error.message, error);
        reject(error);
      }

      if (options.random) {
        options.sorting = z.util.ArrayUtil.random_element(['recent', 'relevant']);

        const total = this.gif_query_cache[options.query];

        if (total != null) {
          if (options.number >= total) {
            offset = 0;
          } else {
            const range = total - options.number;
            offset = Math.floor(Math.random() * range);
          }
        }
      }

      return this.giphy_service.get_search({
        limit: 100,
        query: options.query,
        sorting: options.sorting,
        offset,
      })
      .then(response => {
        let gifs = response.data;

        if (options.random) {
          gifs = gifs.sort(() => .5 - Math.random());
        }

        this.gif_query_cache[options.query] = response.pagination.total_count;

        for (let n of [...Array(options.number).keys()]) {
          if (n === gifs.length) {
            break;
          }

          const gif = gifs[n];
          const { images } = gif;
          const static_gif = images[z.extension.GiphyContentSizes.FIXED_WIDTH_STILL];
          const animation_gif = images[z.extension.GiphyContentSizes.DOWNSIZED];

          if (animation_gif.size > options.max_size) {
            continue;
          } else {
            result.push({
              animated: animation_gif.url,
              static: static_gif.url,
              url: gif.url,
            });
          }
        }

        return resolve(result);
      }).catch(error => {
        this.logger.info(`Unable to fetch gif for query: ${options.query}`, error);
        return reject(error);
      });
    });
  }
};
