/*
 * Copyright (c) 2020-2022 Cynthia K. Rey, All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
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

import test from './test.js'
import { expect } from '@playwright/test'

test.describe.parallel('Twitter integration', () => {
  test('Profile shows pronouns', async ({ page }) => {
    await page.goto('https://twitter.com/cyyynthia_')
    await expect(page.locator('[data-testid="UserProfileHeader_Items"] >> text=it/its')).toBeVisible()
  })

  test('Tweet show pronouns (full view)', async ({ page }) => {
    await page.goto('https://twitter.com/cyyynthia_/status/1519767535775846402')
    await expect(page.locator('article >> text=TweetDeck >> xpath=../.. >> text=it/its')).toBeVisible()
  })

  test('Tweet show pronouns (inline view)', async ({ page }) => {
    await page.goto('https://twitter.com/cyyynthia_/status/1519767535775846402')
    await expect(page.locator('article:has-text("Meow!!!") >> time >> xpath=../.. >> text=it/its')).toBeVisible()
  })

  test('Quoted tweet show pronouns', async ({ page }) => {
    await page.goto('https://twitter.com/cyyynthia_/status/1519767535775846402')
    await expect(page.locator('text=Out of Context Cats@OocCats · >> text=they/them')).toBeVisible()
  })

  test('Hovercard shows pronouns', async ({ page }) => {
    await page.goto('https://twitter.com/cyyynthia_/status/1519767535775846402')

    // This is a hacky way of doing it due to .hover() not working as expected when in headless mode.
    await page.locator('article a').nth(1).evaluate((el) => {
      const div = el.parentElement!
      const key = Object.keys(div).find((k) => k.startsWith('__reactFiber'))
      div[key].return.return.memoizedProps.onHoverIn()
    })

    await expect(page.locator('#layers >> text=Cynthia @cyyynthia_ >> text=it/its')).toBeVisible()
  })

  test.describe.parallel('Implementation quirks', () => {
    // Test is here because internally, a retweet is considered posted by the "retweeter" rather than OP.
    // Relevant issue describing this issue: https://github.com/cyyynthia/pronoundb.org/issues/55
    test('Retweets show pronouns of the poster', async ({ page }) => {
      await page.goto('https://twitter.com/cyyynthia_')
      while (!await page.locator('[data-testid="tweet"]').count()) await page.waitForTimeout(100)

      const locator = page.locator('[data-testid="socialContext"]:has-text("Retweeted")')
      while (!await locator.count()) await page.mouse.wheel(0, 100)

      const tweet = page.locator('[data-testid="tweet"]', { has: locator })
      const el = tweet.locator('time >> xpath=../..').first()

      await expect(el.locator('text=they/them')).toBeVisible()
    })
  })
})
