/**
 * Class: SPcamlQuery
 *
 * SPCamlQuery(listName, query);
 *
 * Params:
 *     - listName(string): Name of the sharepoint document library to query.
 *     - query: The caml query to perform the opperation on.
 */

'use strict';

export class SPCamlQuery {
    private query: string;
    private listName: string;
    private onSuccess: Function;
    private collListItem: any;
    private clientContext: any;

    constructor(listName: string, query: any) {
        this.listName = listName;
        this.query = query;
    };

    public getData(onSuccess: Function): void {
        this.onSuccess = onSuccess;
        this.clientContext = SP.ClientContext.get_current();

        let oList: any = this.clientContext.get_web().get_lists().getByTitle(this.listName);
        let spCamlQuery: any = new SP.CamlQuery();

        spCamlQuery.set_viewXml(this.query);
        this.collListItem = oList.getItems(spCamlQuery);

        this.clientContext.load(this.collListItem);
        this.clientContext.executeQueryAsync(
            Function.createDelegate(this, this.onSuccess),
            Function.createDelegate(this, this.onFail)
        );
    };

    private onFail(sender: any, args: any): void {
        console.log('The ' + this.listName + ' query failed:\n' +
            args.get_message() + '\n' + args.get_stackTrace()
        );
    };
};




/**
 * Class: SPajaxQuery
 *
 * SPCamlQuery(listName, fields);
 *
 * Params:
 *     - listName(string): Name of the sharepoint document library to query.
 *     - query: Array of values to pull from the listName.
 */

export class SPajaxQuery {

    private listName: string;
    private query: string;

    constructor(listName: string, query: string) {
        this.listName = listName;
        this.query = query;
    };

    public getData(onSuccess: Function): void {
        const restUrl: string = _spPageContextInfo.webAbsoluteUrl
            + "/_api/web/lists/getByTitle('"
            + this.listName
            + "')/items"
            + "?"
            + this.query;

        jQuery.ajax({
            url: restUrl,
            type: 'GET',
            headers: {
                "accept": "application/json;odata=verbose",
                "X-RequestDigest": jQuery('#__REQUESTDIGEST').val(),
            },
            success: (data: Object): void => {
                onSuccess(data);
            },
            error: (error: Object): void => {
                console.log('The SPajaxQuery on: ' + (() => this.listName) + ' list failed:\n' + error);
            },
        });
    };
};




/**
 * SPServicesJsonQuery
 *
 * SPServicesJsonQuery(listName, {...settings})
 *
 * Params:
 *    - settings: Object containing a list of settings:
 *                https://spservices.codeplex.com/wikipage?title=$().SPServices.SPGetListItemsJson
 */

export class SPServicesJsonQuery {

    private settings: Object;

    constructor(settings: Object) {
        this.settings = settings;
    };

    public getData(onSuccess: Function): void {

        let requestData: any = jQuery().SPServices.SPGetListItemsJson(this.settings);

        jQuery.when(requestData).done(function(): void {
            onSuccess(this.data);
        }).fail(function(errorThrown: Object): void {
            console.log('The SPServicesJsonQuery on: ' + this.listName + ' list failed.\n' + errorThrown);
        });
    };
};
