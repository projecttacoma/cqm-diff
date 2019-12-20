library SupportingLibrary2 version '1.0.0'

define "Function3":
	"Combination Risk Factors Applicable Any Time"
		union "Osteoporotic Fracture From Patient History"
		union "Parent History of Hip Fracture Assessment"
		union "Osteopenia Before Measurement Period"
		union "First Tobacco Use Screening Indicating Current Smoker"
		union "First Average Number of Drinks Assessments Indicating More Than Two Per Day"
		union "First BMI Exam in Measurement Period Less Than or Equal to 20 kg m2"
		union ["Patient Characteristic Race": "White"]

define "Function4":
	{ First(["Assessment, Performed": "Average Number of Drinks per Drinking Day"] AverageDrinks
			where AverageDrinks.authorDatetime during "Measurement Period"
				and AverageDrinks.result > 2 '{drinks}/d'
			sort by authorDatetime
	)}
