import { expect, test } from '@playwright/test'

test.describe('Folder Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('admin')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('heading', { name: 'DataRoom' })).toBeVisible({ timeout: 5000 })

    await page.getByTestId('new-dataroom-button').click()
    const dataRoomName = `Test Room ${Date.now()}`
    await page.getByTestId('dataroom-name-input').fill(dataRoomName)
    await page.getByTestId('dataroom-create-button').click()
    const dataRoomButton = page.getByTestId('sidebar').getByRole('button', { name: `Select data room ${dataRoomName}` })
    await expect(dataRoomButton).toBeVisible({ timeout: 3000 })
    await dataRoomButton.click()
    await expect(page.getByRole('button', { name: 'New Folder' })).toBeVisible({ timeout: 3000 })
  })

  test('should create a new folder', async ({ page }) => {
    await page.getByRole('button', { name: 'New Folder' }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Create New Folder')).toBeVisible()

    const folderName = `Folder ${Date.now()}`
    await page.getByPlaceholder('Folder name').fill(folderName)
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByTestId('file-viewer-content-area').getByText(folderName)).toBeVisible({ timeout: 3000 })
  })

  test('should not create folder with empty name', async ({ page }) => {
    await page.getByRole('button', { name: 'New Folder' }).click()

    const createButton = page.getByRole('button', { name: 'Create' })
    await expect(createButton).toBeDisabled()
  })

  test('should delete folder using context menu', async ({ page }) => {
    const folderName = `Delete ${Date.now()}`
    await page.getByRole('button', { name: 'New Folder' }).click()
    await page.getByPlaceholder('Folder name').fill(folderName)
    await page.getByRole('button', { name: 'Create' }).click()

    const contentArea = page.getByTestId('file-viewer-content-area')
    await expect(contentArea.getByText(folderName)).toBeVisible({ timeout: 3000 })

    await contentArea.getByText(folderName).click({ button: 'right' })
    await page.getByRole('menuitem', { name: /delete/i }).click()

    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(contentArea.getByText(folderName)).not.toBeVisible({ timeout: 3000 })
  })

  test('should navigate into folder by double clicking', async ({ page }) => {
    const folderName = `Navigate ${Date.now()}`
    await page.getByRole('button', { name: 'New Folder' }).click()
    await page.getByPlaceholder('Folder name').fill(folderName)
    await page.getByRole('button', { name: 'Create' }).click()

    const contentArea = page.getByTestId('file-viewer-content-area')
    await expect(contentArea.getByText(folderName)).toBeVisible({ timeout: 3000 })

    await contentArea.getByText(folderName).dblclick()

    await expect(contentArea.getByText('Drop your PDF files here')).toBeVisible({ timeout: 3000 })
  })

  test('should create nested folders', async ({ page }) => {
    const parentName = `Parent ${Date.now()}`
    await page.getByRole('button', { name: 'New Folder' }).click()
    await page.getByPlaceholder('Folder name').fill(parentName)
    await page.getByRole('button', { name: 'Create' }).click()

    const contentArea = page.getByTestId('file-viewer-content-area')
    await expect(contentArea.getByText(parentName)).toBeVisible({ timeout: 3000 })

    await contentArea.getByText(parentName).dblclick()

    const childName = `Child ${Date.now()}`
    await page.getByRole('button', { name: 'New Folder' }).click()
    await page.getByPlaceholder('Folder name').fill(childName)
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(contentArea.getByText(childName)).toBeVisible({ timeout: 3000 })
  })
})
