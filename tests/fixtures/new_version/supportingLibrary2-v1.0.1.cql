library SupportingLibrary1 version '1.0.1'

define "Function2":
	( ( ["Procedure, Performed": "Gastric Bypass Surgery"]
			union ["Medication, Active": "Aromatase Inhibitors"]
			union ["Medication, Order": "Aromatase Inhibitors"] ) GastricBypassOrAromataseInhibitor
			where GastricBypassOrAromataseInhibitor.relevantPeriod starts before start "Measurement Period"
	)

define "Function1":
	{ First(["Physical Exam, Performed": "BMI Ratio"] BMI
			where BMI.relevantPeriod during "Measurement Period"
				and BMI.result is not null
			sort by start of relevantPeriod
	)}
