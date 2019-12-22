import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import App from '../../src/App.vue';

describe('App.vue', () => {
  it('Contains Title Text', () => {
    const text = 'MITRE CQM-DIFF';
    const wrapper = shallowMount(App);
    expect(wrapper.text()).to.include(text);
  });

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

  it('Create Diff Button Disabled if no files selected', () => {
    const wrapper = shallowMount(App);
    const diffButton = wrapper.find('#createDiffBtn');
    expect(diffButton.attributes().disabled).to.equal('disabled');
  });

  it('Create Diff Button Disabled if only old measure selected', () => {
    const wrapper = shallowMount(App, {
      data() {
        return {
          oldMeasure: 'foo',
          newMeasure: '',
        };
      },
    });
    const diffButton = wrapper.find('#createDiffBtn');
    expect(diffButton.attributes().disabled).to.equal('disabled');
  });

  it('Create Diff Button Disabled if only new measure selected', () => {
    const wrapper = shallowMount(App, {
      data() {
        return {
          oldMeasure: '',
          newMeasure: 'foo',
        };
      },
    });
    const diffButton = wrapper.find('#createDiffBtn');
    expect(diffButton.attributes().disabled).to.equal('disabled');
  });

  it('Create Diff Button enabled if both files selected', () => {
    const wrapper = shallowMount(App, {
      data() {
        return {
          oldMeasure: 'foo',
          newMeasure: 'foo',
        };
      },
    });
    const diffButton = wrapper.find('#createDiffBtn');
    expect(diffButton.attributes().disabled).to.equal(undefined);
  });

  it('Shows invalid package error message if either package is invalid', () => {
  });

  it('Shows diff if both packages valid', () => {
    // for now just show "diff" on the page
  });
});
