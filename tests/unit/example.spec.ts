import { mount } from '@vue/test-utils'
import HomePage from '@/views/HomePage.vue'
import { describe, expect, test } from 'vitest'

describe('HomePage.vue', () => {
  test('renders the clinic landing page', () => {
    const wrapper = mount(HomePage)
    expect(wrapper.text().toLowerCase()).toContain('harbor dental')
  })
})
