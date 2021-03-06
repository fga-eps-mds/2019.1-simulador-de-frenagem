'''
    Schema to Testing model
'''
import json
import graphene
from django.core.exceptions import ObjectDoesNotExist
from django.core import serializers
from graphene_django.types import DjangoObjectType
from emitter import Client
from graphql_jwt.decorators import login_required
from testing.models import Testing
from configuration.models import Config
from utils.general import get_secret
from calibration.models import (
    CalibrationVibration,
    CalibrationSpeed,
    CalibrationRelations,
    CalibrationCommand,
    Calibration
)

# pylint: disable = too-few-public-methods


class TestingType(DjangoObjectType):
    '''
        Defining the Testing Type with django
    '''
    class Meta:
        '''
            Defining the Testing Type
        '''
        model = Testing


class Query:
    # pylint: disable =  unused-argument, no-self-use
    '''
        Defining the resolves to queries of Graphene
    '''
    testing = graphene.Field(
        TestingType,
        id=graphene.ID(),
    )

    all_testing = graphene.List(TestingType)

    @login_required
    def resolve_testing(self, info, **kwargs):
        '''
            Return a Testing object on db by id
        '''
        pk = kwargs.get('id')
        return Testing.objects.get(pk=pk)

    @login_required
    def resolve_all_testing(self, info):
        '''
            Return all Testing objects on db
        '''
        return Testing.objects.all()


class CreateTesting(graphene.Mutation):
    # pylint: disable =  unused-argument, no-self-use
    '''
        Defining the mutate to create a new Testing object on db
    '''
    testing = graphene.Field(TestingType)
    error = graphene.String()

    class Arguments:
        '''
            Arguments required to create a new Testing object
        '''
        create_by = graphene.String()
        id_calibration = graphene.Int()
        id_configuration = graphene.Int()

    @login_required
    def mutate(
            self,
            info,
            create_by,
            id_calibration,
            id_configuration):
        '''
            Define how the arguments are used to create a new Testing object
        '''
        try:
            calibration = Calibration.objects.get(id=id_calibration)
            configuration = Config.objects.get(id=id_configuration)
        except ObjectDoesNotExist:
            return CreateTesting(
                error="Calibration or Configuration does not exist")

        testing = Testing(
            create_by=create_by,
            calibration=calibration,
            configuration=configuration
        )

        testing.save()

        return CreateTesting(testing=testing)


class SubmitTesting(graphene.Mutation):
    '''
        Mutation to submit a testing to unbrake-local with mqtt
    '''
    # pylint: disable =  unused-argument, no-self-use

    succes = graphene.String()

    class Arguments:
        '''
            Id of the Testing object that will be sent to unbrake-local
        '''
        testing_id = graphene.Int()
        mqtt_host = graphene.String()
        mqtt_port = graphene.Int()

    @staticmethod
    def _get_testing_info(testing_id):
        '''
        Get all information needed for performing the experiment
        '''

        testing = Testing.objects.get(pk=testing_id)
        testing = serializers.serialize("json", [testing, ])
        testing = json.loads(testing)[0]

        config = Config.objects.get(pk=testing['fields']['configuration'])
        config = serializers.serialize("json", [config, ])
        config = json.loads(config)[0]

        testing['fields']['configuration'] = config['fields']

        calibration = Calibration.objects.get(
            pk=testing['fields']['calibration']
        )

        calibration_aux = Calibration.objects.get(
            pk=testing['fields']['calibration']
        )

        calibration = serializers.serialize("json", [calibration, ])
        calibration = json.loads(calibration)[0]

        testing['fields']['calibration'] = calibration['fields']

        temperature = calibration_aux.calibrationtemperature_set.all()
        temperature = serializers.serialize("json", temperature)
        temperature = json.loads(temperature)
        temperature[0] = temperature[0]['fields']
        temperature[1] = temperature[1]['fields']

        testing['fields']['calibration']['temperature'] = temperature

        force = calibration_aux.calibrationforce_set.all()
        force = serializers.serialize("json", force)
        force = json.loads(force)
        force[0] = force[0]['fields']
        force[1] = force[1]['fields']

        testing['fields']['calibration']['force'] = force

        vibration = CalibrationVibration.objects.get(
            pk=testing['fields']['calibration']['vibration']
        )
        vibration = serializers.serialize("json", [vibration, ])
        vibration = json.loads(vibration)[0]

        testing['fields']['calibration']['vibration'] = vibration['fields']

        speed = CalibrationSpeed.objects.get(
            pk=testing['fields']['calibration']['speed']
        )
        speed = serializers.serialize("json", [speed, ])
        speed = json.loads(speed)[0]

        testing['fields']['calibration']['speed'] = speed['fields']

        relations = CalibrationRelations.objects.get(
            pk=testing['fields']['calibration']['relations']
        )
        relations = serializers.serialize("json", [relations, ])
        relations = json.loads(relations)[0]

        testing['fields']['calibration']['relations'] = relations['fields']

        command = CalibrationCommand.objects.get(
            pk=testing['fields']['calibration']['command']
        )
        command = serializers.serialize("json", [command, ])
        command = json.loads(command)[0]

        testing['fields']['calibration']['command'] = command['fields']

        return json.dumps(testing)

    def mutate(self, info, testing_id, mqtt_host, mqtt_port):
        '''
            Function to get all objects on db and create a string to be sent
            to unbrake-local
        '''

        client = Client()

        client.connect(
            host=mqtt_host,
            port=mqtt_port,
            secure=False
        )

        testing = SubmitTesting._get_testing_info(testing_id)
        client.publish(
            get_secret('mqtt-writing-key'),
            "unbrake/galpao/experiment",
            testing
        )

        return SubmitTesting(succes=testing)


class QuitExperiment(graphene.Mutation):
    '''
      Class to quit test
    '''
    # pylint: disable = unused-argument, no-self-use, trailing-whitespace,
    # pylint: disable = too-many-arguments

    error = graphene.String()
    response = graphene.String()

    class Arguments:
        '''
          Arguments necessaries to use the mutation
        '''
        username = graphene.String()
        testing_id = graphene.Int()
        mqtt_host = graphene.String()
        mqtt_port = graphene.Int()

    def mutate(self, info, username, testing_id, mqtt_host, mqtt_port):
        '''
          Mutation to execute quiting
        '''
        client = Client()

        client.connect(
            host=mqtt_host,
            port=8080,
            secure=False
        )

        testing = Testing.objects.get(pk=testing_id)
        user = testing.create_by
        if user == username:
            client.publish(
                get_secret('mqtt-writing-key'),
                "unbrake/galpao/quitExperiment",
                "VINTE MIL"
            )

            return QuitExperiment(response="Success")
        return QuitExperiment(error="Permission denied")


class Mutation(graphene.ObjectType):
    '''
        Graphene class concat all mutations
    '''
    create_testing = CreateTesting.Field()
    submit_testing = SubmitTesting.Field()
    quit_testing = QuitExperiment.Field()
