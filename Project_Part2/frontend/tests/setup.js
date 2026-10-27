import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup, configure } from '@testing-library/react'

// Allow for slower CI machines while testing debounced, asynchronous HTTP updates.
configure({ asyncUtilTimeout: 5000 })

// jsdom does not implement the native browser dialog lifecycle.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open')
}

beforeEach(() => window.history.replaceState(null, '', '/'))
afterEach(() => cleanup())
