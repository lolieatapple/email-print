import { print } from "unix-print";

export async function printFile(file) {
  try {
    const fileToPrint = file;
    const printer = undefined;
    const options = ["-o landscape", "-o fit-to-page", "-o media=A4"];
    console.log('ready to print', fileToPrint, printer, options);
    if (process.env.print === 'true') {
      let ret = await print(fileToPrint, printer, options);
      console.log(ret);
    } else {
      console.log('no need print');
    }
  } catch (error) {
    console.log(error);
  }
}
