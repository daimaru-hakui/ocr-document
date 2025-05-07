export const CHATGPT_PROMPT: string = `
以下のDocument AIによって抽出されたエンティティから、
会社名（様の左の部分）、
品名 (product)、色 (color)、数量 (quantity) を抽出し、それらをキーとするJSONオブジェクトを作成してください。
もし該当する情報が見つからない場合は、そのキーの値をnullとしてください。
`;
