import Text "mo:base/Text";
import Float "mo:base/Float";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Iter "mo:base/Iter";
import Char "mo:base/Char";
import Nat32 "mo:base/Nat32";
import Outcall "http-outcalls/outcall";

actor {
  // Retained for upgrade compatibility with previous deployment
  stable let USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

  public query func transform(input : Outcall.TransformationInput) : async Outcall.TransformationOutput {
    Outcall.transform(input)
  };

  // Split text on first occurrence of separator
  func splitFirst(text : Text, sep : Text) : (Text, ?Text) {
    let parts = Iter.toArray(Text.split(text, #text sep));
    if (parts.size() < 2) { return (text, null) };
    var rest = parts[1];
    var i = 2;
    while (i < parts.size()) {
      rest #= sep # parts[i];
      i += 1;
    };
    (parts[0], ?rest)
  };

  // Extract digits from text (skipping leading non-digit chars up to 15 chars)
  func extractDigits(text : Text) : Text {
    var digits = "";
    var collecting = false;
    var skipped = 0;
    label scan for (c in Text.toIter(text)) {
      if (collecting) {
        if (c >= '0' and c <= '9') {
          digits #= Text.fromChar(c);
        } else {
          break scan;
        };
      } else {
        if (c >= '0' and c <= '9') {
          collecting := true;
          digits #= Text.fromChar(c);
        } else {
          skipped += 1;
          if (skipped > 15) { break scan };
        };
      };
    };
    digits
  };

  // Parse digit string to Float
  func digitsToFloat(s : Text) : Float {
    var n : Float = 0.0;
    for (c in Text.toIter(s)) {
      let d = Float.fromInt(Nat32.toNat(Char.toNat32(c)) - 48);
      n := n * 10.0 + d;
    };
    n
  };

  // Parse USDT balance from /api/account response
  // Looks in trc20token_balances for tokenAbbr=USDT, then reads balance field
  func parseUsdtBalance(json : Text) : Float {
    let markers = ["\"tokenAbbr\":\"USDT\"", "\"tokenAbbr\": \"USDT\""];

    for (marker in markers.vals()) {
      let (beforeUsdt, afterUsdtOpt) = splitFirst(json, marker);
      switch (afterUsdtOpt) {
        case (?afterUsdt) {
          // balance field typically appears before tokenAbbr in the same object
          let balanceParts = Iter.toArray(Text.split(beforeUsdt, #text "\"balance\""));
          if (balanceParts.size() >= 2) {
            let lastPart = balanceParts[balanceParts.size() - 1];
            let digits = extractDigits(lastPart);
            if (digits != "") {
              return digitsToFloat(digits) / 1_000_000.0;
            };
          };
          // Fallback: look for balance after the USDT marker
          let (_, afterBalOpt) = splitFirst(afterUsdt, "\"balance\"");
          switch (afterBalOpt) {
            case (?afterBal) {
              let digits = extractDigits(afterBal);
              if (digits != "") {
                return digitsToFloat(digits) / 1_000_000.0;
              };
            };
            case null {};
          };
        };
        case null {};
      };
    };
    0.0
  };

  public func getTronBalance(address : Text) : async Result.Result<Float, Text> {
    let url = "https://apilist.tronscan.org/api/account?address=" # address;
    try {
      let response = await Outcall.httpGetRequest(url, [], transform);
      #ok(parseUsdtBalance(response))
    } catch (e) {
      #err(Error.message(e))
    }
  };

  public query func validateTronAddress(address : Text) : async Bool {
    let chars = Text.toArray(address);
    if (chars.size() != 34) { return false };
    switch (chars[0]) {
      case ('T') { true };
      case (_) { false };
    };
  };
}
