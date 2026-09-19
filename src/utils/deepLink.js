// The province and tab in the URL.
//
// Every view in this dashboard was unaddressable: selecting Tierra del Fuego
// and opening its fiscal tab took four clicks and could not be linked, cited or
// reloaded. For a tool whose whole purpose is to be quoted in an argument about
// provincial finances, that is a real gap — people screenshot it instead.
//
// It also makes the app drivable from outside, which is what the smoke tests
// use to render all nine tabs for the provinces that have actually broken.

import { canonicalProvince } from './provinces';

/** The province named in ?province=, canonicalised, or null. */
export function provinceFromUrl() {
  const raw = new URLSearchParams(window.location.search).get('province');
  return raw ? canonicalProvince(raw) : null;
}

/** The tab named in ?tab=, if it is one of `allowed`. */
export function tabFromUrl(allowed) {
  const raw = new URLSearchParams(window.location.search).get('tab');
  return raw && allowed.includes(raw) ? raw : null;
}

/**
 * Write part of the current view into the address bar.
 *
 * Only the keys actually passed are touched: App owns `province` and BottomBar
 * owns `tab`, and each re-renders independently. If this cleared every absent
 * key, BottomBar's tab sync would delete the province App had just written.
 *
 * replaceState, not pushState: clicking through tabs should not bury the page
 * the reader came from under nine history entries.
 */
export function syncUrl(view) {
  const params = new URLSearchParams(window.location.search);
  for (const key of ['province', 'tab']) {
    if (!(key in view)) continue;
    if (view[key]) params.set(key, view[key]); else params.delete(key);
  }
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(null, '', next);
  }
}
