import Cookies from "universal-cookie";
import { API_URL_GRAPHQL } from "../utils/Constants";
import Request from "../utils/Request";

const cookies = new Cookies();

// class Auth {
/*
 *static authenticate(token) {
 * if (token.token !== undefined && token.token !== null) {
 * if (!Auth.isAuthenticated()) {
 * Auth.lastVerify = Date.now();
 * }
 * clearInterval(Auth.loginCheck);
 * clearTimeout(Auth.loginTimeout);
 * Auth.loginTimeout = setTimeout(Auth.refreshToken, 1000 * 60 * 4);
 * Auth.loginCheck = setInterval(Auth.checkAuth, 10000);
 * localStorage.setItem("token", token.token);
 * localStorage.setItem("username", token.username);
 * localStorage.setItem("userid", token.id);
 * localStorage.setItem("permissions", token.permissions);
 * }
 *}
 */

export async function verifyToken() {
  if (cookies.get("token") === undefined) return false;
  const url = `${API_URL_GRAPHQL}?query=mutation{verifyToken(token: "${cookies.get(
    "token"
  )}"){payload}}`;
  const method = "POST";
  const response = await Request(url, method);
  return response.data.verifyToken.payload.username !== null;
}

export function isAuthenticated() {
  const stringfyCookie = String(cookies.get("token"));
  if (stringfyCookie !== "undefined" && stringfyCookie !== "null") {
    return true;
  }
  localStorage.clear();
  return false;
}

export function hasPermission(permission, loadingVerifyingAuth) {
  return loadingVerifyingAuth && permission !== null;
}

/*
 * export function getAuth(token) {
 *   return (await verifyToken()).data.verifyToken !== null;
 * }
 */

export const deauthenticate = () => {
  return cookies.remove("token");
};

export function isSuperuser(superuser, loadingVerifyingAuth) {
  const currentuserIsSuperuser = loadingVerifyingAuth;
  if (superuser) {
    return currentuserIsSuperuser === true;
  }
  return false;
}
// }

export default {
  isAuthenticated,
  hasPermission,
  // getAuth,
  deauthenticate,
  isSuperuser,
  verifyToken
};
