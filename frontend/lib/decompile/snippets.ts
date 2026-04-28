// Three condensed snippets from the vendor's decompiled APK, used by
// <DecompiledCode /> on the landing page. Each snippet preserves the
// real field names and logic flow; allocator noise like
// `((Foo)localObject1).<init>()` was stripped so the credential trail
// reads on a single screen. Source files live under
// xdo-java-files/xdo_source/pt/xd/xdmapi/ in the repo root.

export type DecompileHighlight = {
  // 0-based line index within the snippet's `code` string.
  line: number;
};

export type DecompileSnippet = {
  id: "xdapi" | "secured-rest" | "get-board-info";
  shortLabel: string;
  fullPath: string;
  caption: { eyebrow: string; body: string; tertiary?: string };
  // First line number shown in the gutter.
  startLine: number;
  // Newline-separated code; do not include a trailing newline.
  code: string;
  highlights: DecompileHighlight[];
};

const XDAPI_CODE = `public final class XDApi
{
  private static final String ADMIN = "info@xd.pt";
  private static final String ADMIN_PASSWORD = "xd";
  private static final String CLIENT_ID = "mobileapps";
  public static final XDApi INSTANCE = new XDApi();
  private static final String TEST_URL = "https://myxd1.azurewebsites.net";
  private static XDSvcApi client;
}`;

const SECURED_REST_CODE = `public void intercept(RequestFacade facade) {
  if (!loggedIn) {
    try {
      FormUrlEncodedTypedOutput body = new FormUrlEncodedTypedOutput();
      body.addField("username", username);            // info@xd.pt
      body.addField("password", password);            // xd
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
    id: "xdapi",
    shortLabel: "XDApi.java",
    fullPath: "pt/xd/xdmapi/networkutils/XDApi.java",
    caption: {
      eyebrow: "What to look for",
      body:
        "Hard-coded credentials. The vendor's whole auth depends on a six-character password and a three-word client_id, all baked into the APK. The TEST_URL is the production endpoint — the variable name lies.",
    },
    startLine: 12,
    code: XDAPI_CODE,
    // Lines 2-6 in the snippet — the four `final String` declarations.
    highlights: [{ line: 2 }, { line: 3 }, { line: 4 }, { line: 6 }],
  },
  {
    id: "secured-rest",
    shortLabel: "SecuredRestBuilder.java",
    fullPath: "pt/xd/xdmapi/networkutils/SecuredRestBuilder.java",
    caption: {
      eyebrow: "What to look for",
      body:
        'Five form fields POSTed to /oauth/token, JSON parsed, then attached as Authorization: Bearer to every subsequent request. The client_secret defaults to "" at line 36 — that\'s the only credential the codebase doesn\'t hand-roll a value for.',
      tertiary:
        "Decompile is condensed: the real source has ((Foo)localObject1).<init>() noise around every allocation.",
    },
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
    fullPath: "pt/xd/xdmapi/networkmessages/GetBoardInfoMessage.java",
    caption: {
      eyebrow: "What to look for",
      body:
        "Every TCP message the handheld sends goes through this builder. The last AddMessageParameter call is where the access_token from Tab 2 enters the message string and becomes the TOKEN[EQ]<uuid> field highlighted in Stage 2 of the inspector.",
    },
    startLine: 33,
    code: GET_BOARD_INFO_CODE,
    // The narrating comment + the line that splices `this.token` into the wire string.
    highlights: [{ line: 14 }, { line: 15 }, { line: 16 }],
  },
];
