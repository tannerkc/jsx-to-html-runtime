export const executeAndReplaceFunctionInString = (inputStr: string) => {
    const functionRegex = /\(([^)]*)\)\s*=>\s*{([^}]*)}/;
  
    const match = inputStr.match(functionRegex);
  
    if (match) {
      const params = match[1].trim();
      const body = match[2].trim();

      const func = new Function(params, body);
  
      const returnValue = func();
  
      const resultStr = inputStr.replace(functionRegex, returnValue);
  
      return resultStr;
    } else {
      return inputStr;
    }
}
