import { SentimentAnalyzer, PorterStemmer } from "natural";

const analyzer = new SentimentAnalyzer("English", PorterStemmer, "afinn");

export const getSentiment = (tokens) => {
  const sentiment = analyzer.getSentiment([...tokens]);

  console.log(sentiment);

  return sentiment > 0;
};
