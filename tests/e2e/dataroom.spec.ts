import { expect, test } from '@playwright/test'

test.describe('Data Room Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('admin')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('heading', { name: 'DataRoom' })).toBeVisible({ timeout: 5000 })
  })

  test('should display empty data rooms section', async ({ page }) => {
    const noDataRoomsText = page.getByText('No DataRooms yet')
    if (await noDataRoomsText.isVisible()) {
      await expect(noDataRoomsText).toBeVisible()
    }
  })

  test('should create a new data room', async ({ page }) => {
    await page.getByTestId('new-dataroom-button').click()

    const dataRoomName = `Test Room ${Date.now()}`
    await page.getByTestId('dataroom-name-input').fill(dataRoomName)
    await page.getByTestId('dataroom-create-button').click()

    await expect(page.getByTestId('sidebar').getByRole('button', { name: `Select data room ${dataRoomName}` })).toBeVisible({ timeout: 3000 })
  })

  test('should not create data room with empty name', async ({ page }) => {
    await page.getByTestId('new-dataroom-button').click()

    const createButton = page.getByTestId('dataroom-create-button')
    await expect(createButton).toBeDisabled()
  })

  test('should select data room', async ({ page }) => {
    await page.getByTestId('new-dataroom-button').click()

    const dataRoomName = `Test Room ${Date.now()}`
    await page.getByTestId('dataroom-name-input').fill(dataRoomName)
    await page.getByTestId('dataroom-create-button').click()

    const dataRoomButton = page.getByTestId('sidebar').getByRole('button', { name: `Select data room ${dataRoomName}` })
    await expect(dataRoomButton).toBeVisible({ timeout: 3000 })

    await dataRoomButton.click()

    await expect(page.getByRole('button', { name: 'New Folder' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('button', { name: 'Upload PDF' })).toBeVisible()
  })

  test('should cancel creating data room', async ({ page }) => {
    await page.getByTestId('new-dataroom-button').click()

    await expect(page.getByTestId('dataroom-name-input')).toBeVisible()

    await page.getByTestId('dataroom-cancel-button').click()

    await expect(page.getByTestId('dataroom-name-input')).not.toBeVisible()
    await expect(page.getByTestId('new-dataroom-button')).toBeVisible()
  })

  test('should delete data room using three dots menu', async ({ page }) => {
    await page.getByTestId('new-dataroom-button').click()

    const dataRoomName = `Delete Test ${Date.now()}`
    await page.getByTestId('dataroom-name-input').fill(dataRoomName)
    await page.getByTestId('dataroom-create-button').click()

    const dataRoomButton = page.getByTestId('sidebar').getByRole('button', { name: `Select data room ${dataRoomName}` })
    await expect(dataRoomButton).toBeVisible({ timeout: 3000 })

    const dataRoomItem = page.locator(`[data-testid^="dataroom-item-"]`).filter({ hasText: dataRoomName })
    await dataRoomItem.hover()

    const actionsButton = dataRoomItem.locator('[data-testid^="dataroom-actions-"]')
    await actionsButton.click()

    await page.getByRole('menuitem', { name: /delete/i }).click()

    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(dataRoomButton).not.toBeVisible({ timeout: 3000 })
  })

  test('should rename data room using three dots menu', async ({ page }) => {
    await page.getByTestId('new-dataroom-button').click()

    const originalName = `Original ${Date.now()}`
    await page.getByTestId('dataroom-name-input').fill(originalName)
    await page.getByTestId('dataroom-create-button').click()

    const originalButton = page.getByTestId('sidebar').getByRole('button', { name: `Select data room ${originalName}` })
    await expect(originalButton).toBeVisible({ timeout: 3000 })

    const dataRoomItem = page.locator(`[data-testid^="dataroom-item-"]`).filter({ hasText: originalName })
    await dataRoomItem.hover()

    const actionsButton = dataRoomItem.locator('[data-testid^="dataroom-actions-"]')
    await actionsButton.click()

    await page.getByRole('menuitem', { name: /rename/i }).click()

    const newName = `Renamed ${Date.now()}`
    await page.keyboard.press('Meta+a')
    await page.keyboard.type(newName)
    await page.keyboard.press('Enter')

    const newButton = page.getByTestId('sidebar').getByRole('button', { name: `Select data room ${newName}` })
    await expect(newButton).toBeVisible({ timeout: 3000 })
    await expect(originalButton).not.toBeVisible()
  })
})
