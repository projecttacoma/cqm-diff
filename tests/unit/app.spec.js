import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import App from '../../src/App.vue';

describe('App.vue', () => {
  it('Contains Old Measure Upload Input', () => {
    const text = 'Old Measure Package';
    const wrapper = shallowMount(App);
    expect(wrapper.text()).to.include(text);
  });
  it('Contains New Measure Upload Input', () => {
    const text = 'New Measure Package';
    const wrapper = shallowMount(App);
    expect(wrapper.text()).to.include(text);
  });
  it('Contains Create Diff Button', () => {
    const text = 'Create Diff';
    const wrapper = shallowMount(App);
    expect(wrapper.text()).to.include(text);
  });
});
