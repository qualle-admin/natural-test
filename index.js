import {
  SentimentAnalyzer,
  PorterStemmer,
  Spellcheck,
  WordTokenizer,
} from "natural";

const analyzer = new SentimentAnalyzer("English", PorterStemmer, "afinn");
const tokenizer = new WordTokenizer();

import { list } from "./helpers/dictionary";
import reasonCodes from "./constants/reasonCodes";

import { approved as approvedMock, declined as declinedMock } from "./mocks";

export const process = async (input) => {
  const corpus = await list();

  const tokens = tokenizer
    .tokenize(input.match(/^(.*)$/m)[0])
    .map((token) => token.toLocaleLowerCase());
  const spellcheck = new Spellcheck(corpus);

  // spell corrections
  const correctedTokens = tokens.flatMap((token) =>
    spellcheck.isCorrect(token) ? token : spellcheck.getCorrections(token, 1)[0]
  );

  const preparedCorrectedTokens = correctedTokens.filter((token) =>
    correctedTokens.includes(token)
  );

  // get sentiment
  const sentiment = analyzer.getSentiment([...preparedCorrectedTokens]);

  console.log(sentiment);
  console.log(preparedCorrectedTokens);

  const mc = input.match(/([MC]+\d{6})+/g);
  const containers = input.match(/([A-z]{4}\d{6,7})+/g);

  const approvedContainers = [];
  const declinedContainers = [];

  // reason code
  const reasonCode = Object.keys(reasonCodes).filter((r) =>
    preparedCorrectedTokens.includes(r)
  )[0];

  const reason = reasonCodes[reasonCode] || null;

  if (sentiment === 0 || sentiment > 0.6) {
    approvedContainers.push(...containers.map((container) => ({ container })));
  } else {
    declinedContainers.push(
      ...containers.map((container) => ({ container, reason }))
    );
  }

  return {
    mc,
    approved: [...approvedContainers],
    declined: [...declinedContainers],
  };
};

(async () => {
  const approvedResult = await process(approvedMock);
  console.log("Approved result: ", approvedResult);

  const declinedResult = await process(declinedMock);
  console.log("Declined result: ", declinedResult);
})();
