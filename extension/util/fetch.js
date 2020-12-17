/*
 * Copyright (c) 2020 Cynthia K. Rey, All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { Pronouns } from '../shared.ts'
import { createDeferred } from './deferred'

function doFetchSingle (platform, id) {
  return new Promise(resolve =>
    chrome.runtime.sendMessage(
      { kind: 'http', target: 'lookup', platform, id },
      function (res) {
        if (res.success) return resolve(res.data)
        console.error('[PronounDB] Failed to fetch:', res.error)
      }
    )
  )
}

function doFetchBulk (platform, ids) {
  return new Promise(resolve =>
    chrome.runtime.sendMessage(
      { kind: 'http', target: 'lookup-bulk', platform, ids },
      function (res) {
        if (res.success) return resolve(res.data)
        console.error('[PronounDB] Failed to fetch:', res.error)
      }
    )
  )
}

const cache = {}
export function fetchPronouns (platform, id) {
  if (!cache[platform]) cache[platform] = {}
  if (!cache[platform][id]) {
    cache[platform][id] = doFetchSingle(platform, id)
      .then(data => data.pronouns ? Pronouns[data.pronouns] : null)
  }
  return cache[platform][id]
}

export async function fetchPronounsBulk (platform, ids) {
  if (!cache[platform]) cache[platform] = {}
  const toFetch = []
  const res = {}
  const def = {}
  for (const id of ids) {
    if (cache[platform][id]) {
      res[id] = await cache[platform][id]
    } else {
      def[id] = createDeferred()
      cache[platform][id] = def[id].promise
      toFetch.push(id)
    }
  }

  if (toFetch.length > 0) {
    const data = await doFetchBulk(platform, toFetch)
    for (const id of toFetch) {
      const pronouns = data[id] ? Pronouns[data[id]] : null
      def[id].resolve(pronouns)
      res[id] = pronouns
    }
  }

  return res
}
