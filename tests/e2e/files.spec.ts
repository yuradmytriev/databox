import { expect, test } from '@playwright/test'
import fs from 'fs'
import os from 'os'
import path from 'path'

test.describe('File Operations', () => {
  let testPdfPath: string

  test.beforeAll(async () => {
    const tempDir = os.tmpdir()
    testPdfPath = path.join(tempDir, 'test-upload.pdf')

    const pdfContent = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n210\n%%EOF'
    )
    fs.writeFileSync(testPdfPath, pdfContent)
  })

  test.afterAll(async () => {
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath)
    }
  })

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

  test('should upload a PDF file', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles(testPdfPath)

    await expect(page.getByTestId('file-viewer-content-area').getByText('test-upload.pdf')).toBeVisible({ timeout: 5000 })
  })

  test('should display empty folder message', async ({ page }) => {
    const contentArea = page.getByTestId('file-viewer-content-area')
    await expect(contentArea.getByText('Drop your PDF files here')).toBeVisible()
    await expect(contentArea.getByText(/click here to browse/i)).toBeVisible()
  })
})
