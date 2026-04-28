// Three condensed snippets from the vendor's decompiled APK, used by
// <DecompiledCode /> on the landing page. Each snippet preserves the
// real field names and logic flow; allocator noise like
// `((Foo)localObject1).<init>()` was stripped so the credential trail
// reads on a single screen. Source files live under
// vpo-java-files/vpo_source/pt/vp/vpmapi/ in the repo root.

export type DecompileHighlight = {
  // 0-based line index within the snippet's `code` string.
  line: number;
};

export type DecompileSnippet = {
  id: "vpapi" | "secured-rest" | "get-board-info";
  shortLabel: string;
  fullPath: string;
  // First line number shown in the gutter.
  startLine: number;
  // Newline-separated code; do not include a trailing newline.
  code: string;
  highlights: DecompileHighlight[];
};

const VPAPI_CODE = `public final class VPApi
{
  private static final String ADMIN = "info@vp.pt";
  private static final String ADMIN_PASSWORD = "vp";
  private static final String CLIENT_ID = "mobileapps";
  public static final VPApi INSTANCE = new VPApi();
  private static final String TEST_URL = "https://myvp1.azurewebsites.net";
  private static VPSvcApi client;
}`;

const SECURED_REST_CODE = `public void intercept(RequestFacade facade) {
  if (!loggedIn) {
    try {
      FormUrlEncodedTypedOutput body = new FormUrlEncodedTypedOutput();
      body.addField("username", username);            // info@vp.pt
      body.addField("password", password);            // vp
      body.addField("client_id", clientId);           // mobileapps
      body.addField("client_secret", clientSecret);   // "" — defaulted at line 36
      body.addField("grant_type", "password");

      Request req = new Request("POST", tokenIssuingEndpoint, headers, body);
      Response res = client.execute(req);

      if (res.getStatus() / 100 == 2) {
        String json = IOUtils.toString(res.getBody().in());
        accessToken = new Gson()
          .fromJson(json, JsonObject.class)
          .get("access_token").getAsString();
        facade.addHeader("Authorization", "Bearer " + accessToken);
        loggedIn = true;
        return;
      }
      throw new SecuredRestException("Login failure: " + res.getStatus());
    } catch (Exception e) { throw new SecuredRestException(e); }
  }
  facade.addHeader("Authorization", "Bearer " + accessToken);
}`;

const GET_BOARD_INFO_CODE = `public DeliverableMessage MakeDeliverable() {
  DeliverableMessage out = new DeliverableMessage();

  String s = NetworkMessageUtils.IdentifyMessage(
                Grammar.GET_BOARD_CONTENT_IDENTIFIER);
  s = s + NetworkMessageUtils.AddProtocolVersion(protocolVersion);

  s = s + NetworkMessageUtils.AddMessageParameter(
            Grammar.BOARD_ID_PARAMETER, Long.toString(boardId));
  s = s + NetworkMessageUtils.AddMessageParameter(
            Grammar.TYPE_PARAMETER, type);
  s = s + NetworkMessageUtils.AddMessageParameter(
            NetworkLanguage.KEY_USER_ID, userId);

  // The line that closes the loop on Stage 2 of the inspector above.
  this.messageString = s + NetworkMessageUtils.AddMessageParameter(
                             NetworkLanguage.KEY_TOKEN, this.token);

  out.AddMessage(GetBoardInfoMessage.class, this);
  return out;
}`;

export const DECOMPILE_SNIPPETS: DecompileSnippet[] = [
  {
    id: "vpapi",
    shortLabel: "VPApi.java",
    fullPath: "pt/vp/vpmapi/networkutils/VPApi.java",
    startLine: 12,
    code: VPAPI_CODE,
    // Lines 2-6 in the snippet — the four `final String` declarations.
    highlights: [{ line: 2 }, { line: 3 }, { line: 4 }, { line: 6 }],
  },
  {
    id: "secured-rest",
    shortLabel: "SecuredRestBuilder.java",
    fullPath: "pt/vp/vpmapi/networkutils/SecuredRestBuilder.java",
    startLine: 163,
    code: SECURED_REST_CODE,
    // The five addField rows, the three-line JSON parse that assigns
    // accessToken, and the Bearer-header line that follows.
    highlights: [
      { line: 4 },
      { line: 5 },
      { line: 6 },
      { line: 7 },
      { line: 8 },
      { line: 15 },
      { line: 16 },
      { line: 17 },
      { line: 18 },
    ],
  },
  {
    id: "get-board-info",
    shortLabel: "GetBoardInfoMessage.java",
    fullPath: "pt/vp/vpmapi/networkmessages/GetBoardInfoMessage.java",
    startLine: 33,
    code: GET_BOARD_INFO_CODE,
    // The narrating comment + the line that splices `this.token` into the wire string.
    highlights: [{ line: 14 }, { line: 15 }, { line: 16 }],
  },
];
