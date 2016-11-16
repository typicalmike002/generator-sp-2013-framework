/**
 * function: convertSPDate
 *
 * A function to convert a standard SharePoint date/time
 * field (YYYY-MM-DD HH:MM:SS) to a javascript Date() 
 *
 * Params: 
 *   - date: SharePoint date to be converted to
 *
 * Based off of code by Ben Tedder (www.bentedder.com) 
 */

export function convertSPDate(date: string){
    let xDate: string = date.split('T')[0],
        xTime: string = date.split('T')[1];

    let xTimeParts: Array<string> = xTime.split(':'),
        xHour: string = xTimeParts[0],
        xMin: string = xTimeParts[1],
        xSec: string = xTimeParts[2];

    let xDateParts: Array<string> = xDate.split('-'),
        xYear: number = parseInt(xDateParts[0]),
        xMonth: number = parseInt(xDateParts[1]),
        xDay: number = parseInt(xDateParts[2]);

    const dDate: Date = new Date(xYear, xMonth - 1, xDay);
    return dDate;
}