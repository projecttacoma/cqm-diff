library OldVersion version '1.0.1'

using QDM version '5.4'

include SupportingLibrary1 version '1.0.1' called SupportingLibrary1
include SupportingLibrary2 version '1.0.1' called SupportingLibrary1

valueset "Average Number of Drinks per Drinking Day": 'urn:oid:2.16.840.1.113883.3.464.1003.106.12.1018'
valueset "Ankylosing Spondylitis": 'urn:oid:2.16.840.1.113883.3.464.1003.113.12.1045'
valueset "Aromatase Inhibitors": 'urn:oid:2.16.840.1.113883.3.464.1003.196.12.1265'

code "Birth date": '21112-8' from "LOINC" display 'Birth date'
code "Every eight hours (qualifier value)": '307469008' from "SNOMEDCT" display 'Every eight hours (qualifier value)'

parameter "Measurement Period" Interval<DateTime>

context Patient

define "AAASDE Ethnicity":
	["Patient Characteristic Ethnicity": "Ethnicity"]


define "SDE Race":
	["Patient Characteristic Race": "Race"]

define "SDE Sex":
	["Patient Characteristic Sex": "ONC Administrative Sex"]

define "SDE Payer":
	["Patient Characteristic Payer": "Payer"]


define "Numerator":
	exists ["Diagnostic Study, Order": "DXA (Dual energy Xray Absorptiometry) Scan"] DXA
		where DXA.authorDatetime during "Measurement Period"

define "Denominator":
	"Initial Population New"
